"""
Employment News scraper — downloads the latest weekly PDF, extracts text,
and uses the Anthropic Claude API to produce structured job listings.
"""

import io
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

import anthropic
import pdfplumber
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.employmentnews.gov.in"
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_FILE = OUTPUT_DIR / "employment_news.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    )
}


def find_latest_pdf_url() -> str:
    resp = requests.get(BASE_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    for a in soup.find_all("a", href=True):
        href: str = a["href"]
        if href.lower().endswith(".pdf"):
            return href if href.startswith("http") else BASE_URL.rstrip("/") + "/" + href.lstrip("/")

    for a in soup.find_all("a", href=True, string=re.compile(r"(PDF|Download|Weekly)", re.I)):
        href = a["href"]
        return href if href.startswith("http") else BASE_URL.rstrip("/") + "/" + href.lstrip("/")

    raise RuntimeError("Could not find the latest Employment News PDF link on the homepage.")


def download_pdf(url: str) -> bytes:
    print(f"Downloading PDF: {url}")
    resp = requests.get(url, headers=HEADERS, timeout=120, stream=True)
    resp.raise_for_status()
    chunks = []
    for chunk in resp.iter_content(chunk_size=65536):
        if chunk:
            chunks.append(chunk)
    data = b"".join(chunks)
    print(f"Downloaded {len(data) / 1024:.1f} KB")
    return data


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        total = len(pdf.pages)
        print(f"Extracting text from {total} pages…")
        for i, page in enumerate(pdf.pages, 1):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(page_text)
            if i % 20 == 0:
                print(f"  Processed {i}/{total} pages")
    return "\n\n".join(text_parts)


def fix_vacancies(jobs: list[dict]) -> list[dict]:
    """
    Second pass: for jobs where vacancies is null, attempt to extract
    the count from notes/title patterns. If still null, set
    vacancies_display to 'See notification'.
    """
    for job in jobs:
        if job.get("vacancies") is not None:
            job["vacancies_display"] = str(job["vacancies"])
            continue

        title = job.get("job_title") or ""
        notes = job.get("notes") or ""
        combined = title + " " + notes
        extracted = None

        # Pattern 1: category breakdown UR-04, OBC-01, SC-01 … → sum all numbers
        cats = re.findall(
            r'\b(?:UR|EWS|OBC|SC|ST|PwBD|OH|VH|HH|Gen|General)\s*[-–]\s*(\d+)',
            combined, re.I
        )
        if cats:
            extracted = sum(int(c) for c in cats)

        # Pattern 2: "x2", "x4" in title (e.g. "Member (Technical) x2")
        if extracted is None:
            m = re.search(r'\bx\s*(\d+)\b', title, re.I)
            if m:
                extracted = int(m.group(1))

        # Pattern 3: "17 posts", "9 posts" anywhere
        if extracted is None:
            m = re.search(r'\b(\d+)\s+posts?\b', combined, re.I)
            if m:
                n = int(m.group(1))
                if 1 <= n <= 1000:
                    extracted = n

        # Pattern 4: "(\d+) vacancies" anywhere
        if extracted is None:
            m = re.search(r'\b(\d+)\s+vacanc', combined, re.I)
            if m:
                extracted = int(m.group(1))

        # Pattern 5: "(\d+) positions" in notes
        if extracted is None:
            m = re.search(r'\b(\d+)\s+positions?\b', notes, re.I)
            if m:
                n = int(m.group(1))
                if 1 <= n <= 1000:
                    extracted = n

        if extracted is not None:
            job["vacancies"] = extracted
            job["vacancies_display"] = str(extracted)
        else:
            job["vacancies_display"] = "See notification"

    return jobs


def extract_jobs_with_claude(text: str, source_url: str) -> list[dict]:
    client = anthropic.Anthropic()

    MAX_CHARS = 120_000
    if len(text) > MAX_CHARS:
        print(f"Text truncated from {len(text):,} to {MAX_CHARS:,} chars for API call.")
        text = text[:MAX_CHARS]

    system_prompt = (
        "You are a structured-data extraction assistant specialised in Indian government job notifications. "
        "Extract every distinct job/recruitment advertisement from the provided text and return ONLY a valid "
        "JSON array (no markdown fences, no prose). Each element must have exactly these keys:\n"
        "  job_title, organization, vacancies, qualification, age_limit, "
        "application_deadline, location, notes\n"
        "Use null for any field that is not mentioned. vacancies must be an integer or null. "
        "In the notes field include: salary/pay level, category breakdown (UR/OBC/SC/ST counts), "
        "application instructions, important dates, and any URLs mentioned. "
        "Dates should be ISO-8601 (YYYY-MM-DD) where possible, otherwise a human-readable string."
    )

    user_prompt = (
        f"Source URL: {source_url}\n\n"
        "Below is text extracted from an Employment News PDF issue. "
        "Extract all job/recruitment listings:\n\n"
        f"{text}"
    )

    print("Calling Claude API (streaming)…")
    with client.messages.stream(
        model="claude-opus-4-8",
        max_tokens=8192,
        thinking={"type": "adaptive"},
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        message = stream.get_final_message()

    raw = ""
    for block in message.content:
        if block.type == "text":
            raw = block.text.strip()
            break

    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    jobs: list[dict] = json.loads(raw)
    return jobs


def save_output(jobs: list[dict], source_url: str) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "scraped_at": datetime.utcnow().isoformat() + "Z",
        "source_url": source_url,
        "total_jobs": len(jobs),
        "jobs": jobs,
    }
    OUTPUT_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Saved {len(jobs)} jobs → {OUTPUT_FILE}")


def main() -> None:
    try:
        pdf_url = find_latest_pdf_url()
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)

    pdf_bytes = download_pdf(pdf_url)
    text = extract_text_from_pdf(pdf_bytes)

    if not text.strip():
        print("ERROR: No text could be extracted from the PDF.", file=sys.stderr)
        sys.exit(1)

    print(f"Extracted ~{len(text):,} characters of text.")

    jobs = extract_jobs_with_claude(text, pdf_url)

    print("Running vacancy fix-up pass…")
    jobs = fix_vacancies(jobs)

    fixed = sum(1 for j in jobs if j.get("vacancies_display") not in (None, "See notification") and j.get("vacancies") is not None)
    see_notif = sum(1 for j in jobs if j.get("vacancies_display") == "See notification")
    print(f"  Vacancies resolved: {fixed} | 'See notification': {see_notif}")

    save_output(jobs, pdf_url)

    print(f"\nSummary: found {len(jobs)} job listing(s).")
    for job in jobs[:5]:
        print(f"  • {job.get('job_title', '—')[:55]} | vacancies: {job.get('vacancies_display', '—')}")
    if len(jobs) > 5:
        print(f"  … and {len(jobs) - 5} more.")


if __name__ == "__main__":
    main()
