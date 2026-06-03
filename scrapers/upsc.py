"""
UPSC scraper — scrapes active examinations from upsc.gov.in,
downloads linked PDFs, uses Claude API to extract structured job data,
and upserts into Supabase jobs table with exam_type = "UPSC".

Run: python3 scrapers/upsc.py
"""

from __future__ import annotations

import io
import json
import os
import re
import time
import uuid
from typing import Optional

import anthropic
import pdfplumber
import requests
from bs4 import BeautifulSoup
from supabase import create_client

BASE_URL = "https://upsc.gov.in"
ACTIVE_EXAMS_URL = "https://upsc.gov.in/examinations/active-examinations"
APPLY_URL = "https://upsconline.nic.in"
SOURCE = "UPSC Website"
EXAM_TYPE = "UPSC"
ORG = "Union Public Service Commission (UPSC)"

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://impjnmmwjrvhlrrtkomh.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcGpubW13anJ2aGxycnRrb21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTQ1MjEsImV4cCI6MjA5NTk5MDUyMX0.MSqyZ6BCj5PJ9nacSpOFCM7zQ42gcZkZotcCiq4nBec",
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

SYSTEM_PROMPT = """You are a structured-data extraction assistant for Indian government job notifications.
Given text from a UPSC exam/recruitment notification, extract job data and return ONLY a valid JSON array
(no markdown, no prose). Each object must have exactly these keys:
  job_title, organization, vacancies, qualification, age_limit,
  application_deadline, exam_date, location, notes
Rules:
- organization: "Union Public Service Commission (UPSC)" unless clearly different
- vacancies: integer or null
- application_deadline, exam_date: ISO-8601 (YYYY-MM-DD) if possible, else human-readable string
- notes: include salary/pay scale, category breakdown, selection process, any URLs
- One object per distinct post/exam
- null for any missing field"""


def slugify(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[\s_]+", "-", s)[:80]


def parse_deadline(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    months = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    }
    s = s.strip()
    try:
        from datetime import datetime
        datetime.fromisoformat(s)
        return s
    except Exception:
        pass
    m = re.search(r"(\d{1,2})[/\-\s](\w+)[/\-\s](\d{4})", s)
    if m:
        day, mon_str, year = int(m.group(1)), m.group(2)[:3].lower(), int(m.group(3))
        mon = months.get(mon_str)
        if mon:
            return f"{year:04d}-{mon:02d}-{day:02d}"
    return s


def infer_status(deadline_str: Optional[str]) -> str:
    if not deadline_str:
        return "Open"
    from datetime import datetime
    try:
        diff = (datetime.fromisoformat(deadline_str) - datetime.utcnow()).days
        return "Closing Soon" if 0 <= diff <= 7 else "Open"
    except Exception:
        return "Open"


def download_pdf(url: str) -> Optional[bytes]:
    try:
        r = requests.get(url, headers=HEADERS, timeout=60)
        r.raise_for_status()
        return r.content
    except Exception as e:
        print(f"  Warning: PDF download failed {url}: {e}")
        return None


def pdf_to_text(pdf_bytes: bytes) -> str:
    try:
        parts = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or ""
                if t.strip():
                    parts.append(t)
        return "\n\n".join(parts)
    except Exception as e:
        print(f"  Warning: PDF text extraction failed: {e}")
        return ""


def existing_titles(supabase) -> set[str]:
    try:
        res = supabase.table("jobs").select("title").eq("exam_type", EXAM_TYPE).execute()
        return {r["title"].strip().lower() for r in (res.data or [])}
    except Exception:
        return set()


def fetch_active_exams() -> list[dict]:
    print(f"Fetching: {ACTIVE_EXAMS_URL}")
    try:
        r = requests.get(ACTIVE_EXAMS_URL, headers=HEADERS, timeout=30)
        r.raise_for_status()
    except Exception as e:
        print(f"ERROR: {e}")
        return []

    soup = BeautifulSoup(r.text, "lxml")
    items: list[dict] = []
    seen: set[str] = set()

    for a in soup.find_all("a", href=True):
        href: str = a["href"]
        text = a.get_text(strip=True)
        if not text or len(text) < 8:
            continue
        keywords = ["exam", "recruitment", "selection", "civil services",
                    "combined", "engineering", "medical", "interview", "notice"]
        if not any(kw in text.lower() for kw in keywords) and not href.lower().endswith(".pdf"):
            continue
        full_url = href if href.startswith("http") else BASE_URL.rstrip("/") + "/" + href.lstrip("/")
        if full_url not in seen:
            seen.add(full_url)
            items.append({"title": text, "url": full_url, "is_pdf": href.lower().endswith(".pdf")})

    print(f"  Found {len(items)} links")
    return items


def fetch_text(item: dict) -> str:
    url = item["url"]
    if item.get("is_pdf"):
        pdf = download_pdf(url)
        return pdf_to_text(pdf) if pdf else ""
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        # Try embedded PDF links first
        for a in soup.find_all("a", href=True):
            if a["href"].lower().endswith(".pdf"):
                pdf_url = a["href"] if a["href"].startswith("http") else BASE_URL + "/" + a["href"].lstrip("/")
                pdf = download_pdf(pdf_url)
                if pdf:
                    text = pdf_to_text(pdf)
                    if text.strip():
                        return text
        for tag in soup(["script", "style", "nav", "header", "footer"]):
            tag.decompose()
        return soup.get_text(separator="\n", strip=True)
    except Exception as e:
        print(f"  Warning: fetch failed {url}: {e}")
        return ""


def extract_with_claude(title: str, text: str) -> list[dict]:
    if not text.strip():
        return []
    client = anthropic.Anthropic()
    text = text[:80_000]
    try:
        with client.messages.stream(
            model="claude-opus-4-8",
            max_tokens=4096,
            thinking={"type": "adaptive"},
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Notification title: {title}\n\nContent:\n{text}"}],
        ) as stream:
            message = stream.get_final_message()
        raw = next((b.text.strip() for b in message.content if b.type == "text"), "[]")
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        result = json.loads(raw)
        return [result] if isinstance(result, dict) else result
    except Exception as e:
        print(f"  Warning: Claude extraction failed: {e}")
        return []


def transform(raw: dict, idx: int, notification_url: str) -> dict:
    title = (raw.get("job_title") or "Untitled")[:255]
    org = (raw.get("organization") or ORG)[:255]
    deadline_raw = raw.get("application_deadline")
    deadline = parse_deadline(deadline_raw)
    notes = raw.get("notes") or ""
    qualification = raw.get("qualification") or ""
    vacancies = raw.get("vacancies")
    slug = slugify(title) + f"-upsc-{idx}"

    return {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, slug)),
        "title": title,
        "organization": org,
        "category": "General",
        "exam_type": EXAM_TYPE,
        "vacancies": vacancies,
        "vacancies_display": "See notification" if vacancies is None else str(vacancies),
        "eligibility": qualification[:500],
        "last_date": deadline,
        "ai_summary": (notes or qualification)[:600],
        "location": (raw.get("location") or "All India")[:255],
        "status": infer_status(deadline),
        "notification_url": notification_url,
        "apply_url": APPLY_URL,
        "age_limit": (raw.get("age_limit") or "")[:100],
        "source": SOURCE,
        "details": json.dumps({
            "qualification": qualification,
            "age_limit": raw.get("age_limit"),
            "application_deadline": deadline_raw,
            "exam_date": raw.get("exam_date"),
            "location": raw.get("location"),
            "notes": notes,
            "vacancies": vacancies,
            "source": SOURCE,
        }, ensure_ascii=False),
    }


def main() -> int:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    known = existing_titles(supabase)
    print(f"Already in DB: {len(known)} UPSC jobs")

    exams = fetch_active_exams()
    if not exams:
        print("No exam links found.")
        return 0

    records: list[dict] = []
    idx = 0

    for exam in exams:
        print(f"\nProcessing: {exam['title'][:70]}")
        try:
            text = fetch_text(exam)
            if not text.strip():
                print("  Skipping — no text")
                continue
            jobs = extract_with_claude(exam["title"], text)
            print(f"  Extracted {len(jobs)} job(s)")
            for job in jobs:
                title = (job.get("job_title") or exam["title"])[:255]
                if title.strip().lower() in known:
                    print(f"  Skip (exists): {title[:55]}")
                    continue
                records.append(transform(job, idx, exam["url"]))
                known.add(title.strip().lower())
                idx += 1
            time.sleep(1)
        except Exception as e:
            print(f"  ERROR: {e}")
            continue

    if not records:
        print("\nNo new UPSC jobs to insert.")
        return 0

    print(f"\nUpserting {len(records)} new UPSC job(s)…")
    result = supabase.table("jobs").upsert(records).execute()
    added = len(result.data or [])
    print(f"Done. Rows affected: {added}")
    for r in records[:5]:
        print(f"  • {r['title'][:60]}")
    return added


if __name__ == "__main__":
    main()
