"""
Local PDF scraper — scans scrapers/pdfs/ for new Employment News PDFs,
parses them with Claude, and upserts jobs to Supabase.
Skips PDFs already recorded in the processed_pdfs table.
"""

from __future__ import annotations

import io
import json
import os
import re
import sys
import uuid
from datetime import datetime
from pathlib import Path

import anthropic
import pdfplumber
from supabase import create_client

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

PDF_DIR = Path(__file__).parent / "pdfs"

EXAM_TYPE_MAP = {
    "upsc": "UPSC", "ssc": "SSC",
    "rrb": "Railways", "railway": "Railways",
    "ibps": "Banking", "sbi": "Banking", "bank": "Banking",
    "defence": "Defence", "drdo": "Defence", "army": "Defence",
    "teaching": "Teaching", "professor": "Teaching",
    "police": "Police", "cisf": "Police",
    "psc": "State PSC",
}


def already_processed(filename: str) -> bool:
    result = supabase.from_("processed_pdfs").select("id").eq("filename", filename).limit(1).execute()
    return len(result.data) > 0


def mark_processed(filename: str, jobs_added: int) -> None:
    supabase.from_("processed_pdfs").insert({
        "filename": filename,
        "jobs_added": jobs_added,
        "processed_at": datetime.utcnow().isoformat() + "Z",
    }).execute()


def extract_text(pdf_path: Path) -> str:
    parts = []
    with pdfplumber.open(pdf_path) as pdf:
        print(f"  Extracting text from {len(pdf.pages)} pages…")
        for page in pdf.pages:
            t = page.extract_text() or ""
            if t.strip():
                parts.append(t)
    return "\n\n".join(parts)


def extract_jobs_with_claude(text: str, filename: str) -> list[dict]:
    client = anthropic.Anthropic()
    MAX_CHARS = 120_000
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]

    system_prompt = (
        "You are a structured-data extraction assistant specialised in Indian government job notifications. "
        "Extract every distinct job/recruitment advertisement and return ONLY a valid JSON array "
        "(no markdown, no prose). Each element must have exactly these keys:\n"
        "  job_title, organization, vacancies, qualification, age_limit, "
        "application_deadline, location, notes\n"
        "Use null for missing fields. vacancies must be integer or null. "
        "Dates in ISO-8601 (YYYY-MM-DD) where possible."
    )

    print("  Calling Claude API…")
    with client.messages.stream(
        model="claude-opus-4-8",
        max_tokens=16000,
        thinking={"type": "adaptive"},
        system=system_prompt,
        messages=[{"role": "user", "content": f"Source: {filename}\n\n{text}"}],
    ) as stream:
        message = stream.get_final_message()

    raw = next((b.text.strip() for b in message.content if b.type == "text"), "[]")
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    # Truncated JSON recovery: strip incomplete last element and close the array
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        last_close = raw.rfind("},")
        if last_close != -1:
            raw = raw[: last_close + 1] + "]"
            return json.loads(raw)
        raise


def infer_exam_type(title: str, org: str) -> str:
    text = (title + " " + org).lower()
    for key, val in EXAM_TYPE_MAP.items():
        if key in text:
            return val
    return "Central Govt"


def infer_status(deadline_str: str | None) -> str:
    if not deadline_str:
        return "Open"
    try:
        deadline = datetime.fromisoformat(deadline_str[:10])
        days_left = (deadline - datetime.utcnow()).days
        if 0 < days_left <= 7:
            return "Closing Soon"
    except Exception:
        pass
    return "Open"


def upsert_jobs(jobs: list[dict], filename: str) -> int:
    added = 0
    source = f"Employment News PDF — {filename}"

    for job in jobs:
        title = (job.get("job_title") or "").strip()
        org = (job.get("organization") or "").strip()
        if not title or not org:
            continue

        vacancies = job.get("vacancies")
        if isinstance(vacancies, str):
            m = re.search(r'\d+', vacancies)
            vacancies = int(m.group()) if m else None
        vacancies_display = str(vacancies) if vacancies else "See notification"

        deadline = job.get("application_deadline")
        if deadline and len(str(deadline)) > 10:
            deadline = str(deadline)[:10]

        # Skip duplicates
        existing = supabase.from_("jobs").select("id") \
            .eq("title", title).eq("organization", org).limit(1).execute()
        if existing.data:
            continue

        row = {
            "id": str(uuid.uuid4()),
            "title": title,
            "organization": org,
            "category": "Central Government",
            "exam_type": infer_exam_type(title, org),
            "vacancies": vacancies,
            "vacancies_display": vacancies_display,
            "eligibility": (job.get("qualification") or "As per notification")[:200],
            "last_date": deadline or None,
            "ai_summary": (
                f"{org} recruiting for {title}. "
                + (f"Vacancies: {vacancies_display}. " if vacancies_display != "See notification" else "")
                + (f"Deadline: {deadline}." if deadline else "Check notification for deadline.")
            )[:300],
            "location": (job.get("location") or "India")[:100],
            "status": infer_status(deadline),
            "notification_url": f"https://www.employmentnews.gov.in",
            "apply_url": f"https://www.employmentnews.gov.in",
            "source": source,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }

        try:
            supabase.from_("jobs").insert(row).execute()
            added += 1
        except Exception as e:
            print(f"  ⚠ Failed to insert '{title}': {e}")

    return added


def main() -> int:
    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        print("No PDFs found in scrapers/pdfs/")
        return 0

    print(f"Found {len(pdfs)} PDF(s) in scrapers/pdfs/")
    total_added = 0

    for pdf_path in pdfs:
        filename = pdf_path.name
        print(f"\n── {filename} ──")

        if already_processed(filename):
            print("  Already processed, skipping.")
            continue

        text = extract_text(pdf_path)
        if not text.strip():
            print("  No text extracted, skipping.")
            continue

        print(f"  Extracted {len(text):,} chars.")
        jobs = extract_jobs_with_claude(text, filename)
        print(f"  Claude found {len(jobs)} jobs.")

        added = upsert_jobs(jobs, filename)
        mark_processed(filename, added)
        print(f"  ✓ {added} new jobs added.")
        total_added += added

    print(f"\nTotal new jobs added: {total_added}")
    return total_added


if __name__ == "__main__":
    main()
