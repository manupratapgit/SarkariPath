"""
Google Drive Employment News scraper.
Checks a shared Drive folder for new PDFs, downloads them, parses with Claude,
and upserts jobs to Supabase — skipping PDFs already processed.

Requires env vars:
  GOOGLE_SERVICE_ACCOUNT_JSON  — full JSON of service account key (as a string)
  GDRIVE_FOLDER_ID             — Google Drive folder ID to watch
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  ANTHROPIC_API_KEY
"""

from __future__ import annotations

import io
import json
import os
import re
import sys
import uuid
import urllib.parse
from datetime import datetime
from pathlib import Path

import anthropic
import pdfplumber
import requests
from supabase import create_client

# ── Supabase ────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Google Drive ─────────────────────────────────────────────────────────────
FOLDER_ID = os.environ.get("GDRIVE_FOLDER_ID", "")
GDRIVE_API = "https://www.googleapis.com/drive/v3"
GDRIVE_DOWNLOAD = "https://www.googleapis.com/drive/v3/files"


def get_access_token() -> str:
    """Get a short-lived access token from a service account JSON key."""
    import time
    import base64
    import hmac
    import hashlib

    sa_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    if not sa_json:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON env var not set")

    sa = json.loads(sa_json)
    email = sa["client_email"]
    private_key = sa["private_key"]

    now = int(time.time())
    claim = {
        "iss": email,
        "scope": "https://www.googleapis.com/auth/drive.readonly",
        "aud": "https://oauth2.googleapis.com/token",
        "iat": now,
        "exp": now + 3600,
    }

    # Build JWT
    def b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    header = b64(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())
    payload = b64(json.dumps(claim).encode())
    signing_input = f"{header}.{payload}".encode()

    # Sign with private key using cryptography library
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding

    key = serialization.load_pem_private_key(private_key.encode(), password=None)
    signature = key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
    jwt = f"{header}.{payload}.{b64(signature)}"

    resp = requests.post("https://oauth2.googleapis.com/token", data={
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": jwt,
    })
    resp.raise_for_status()
    return resp.json()["access_token"]


def list_pdfs_in_folder(token: str, folder_id: str) -> list[dict]:
    """List all PDF files in the Drive folder."""
    params = {
        "q": f"'{folder_id}' in parents and mimeType='application/pdf' and trashed=false",
        "fields": "files(id,name,createdTime,modifiedTime)",
        "orderBy": "createdTime desc",
        "pageSize": 20,
    }
    resp = requests.get(
        f"{GDRIVE_API}/files",
        headers={"Authorization": f"Bearer {token}"},
        params=params,
    )
    resp.raise_for_status()
    return resp.json().get("files", [])


def already_processed(file_id: str) -> bool:
    """Check if this Drive file ID was already scraped (stored in jobs source_url)."""
    result = supabase.from_("jobs") \
        .select("id") \
        .like("notification_url", f"%{file_id}%") \
        .limit(1) \
        .execute()
    return len(result.data) > 0


def download_pdf(token: str, file_id: str) -> bytes:
    resp = requests.get(
        f"{GDRIVE_DOWNLOAD}/{file_id}?alt=media",
        headers={"Authorization": f"Bearer {token}"},
        timeout=120,
        stream=True,
    )
    resp.raise_for_status()
    data = b"".join(resp.iter_content(65536))
    print(f"  Downloaded {len(data) / 1024:.1f} KB")
    return data


def extract_text(pdf_bytes: bytes) -> str:
    parts = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        print(f"  Extracting text from {len(pdf.pages)} pages…")
        for page in pdf.pages:
            t = page.extract_text() or ""
            if t.strip():
                parts.append(t)
    return "\n\n".join(parts)


def extract_jobs_with_claude(text: str, source_label: str) -> list[dict]:
    client = anthropic.Anthropic()
    MAX_CHARS = 120_000
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]

    system_prompt = (
        "You are a structured-data extraction assistant specialised in Indian government job notifications. "
        "Extract every distinct job/recruitment advertisement from the provided text and return ONLY a valid "
        "JSON array (no markdown fences, no prose). Each element must have exactly these keys:\n"
        "  job_title, organization, vacancies, qualification, age_limit, "
        "application_deadline, location, notes\n"
        "Use null for any field not mentioned. vacancies must be an integer or null. "
        "Dates should be ISO-8601 (YYYY-MM-DD) where possible."
    )

    print("  Calling Claude API…")
    with client.messages.stream(
        model="claude-opus-4-8",
        max_tokens=16000,
        thinking={"type": "adaptive"},
        system=system_prompt,
        messages=[{"role": "user", "content": f"Source: {source_label}\n\n{text}"}],
    ) as stream:
        message = stream.get_final_message()

    raw = next((b.text.strip() for b in message.content if b.type == "text"), "[]")
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        last_close = raw.rfind("},")
        if last_close != -1:
            raw = raw[: last_close + 1] + "]"
            return json.loads(raw)
        raise


EXAM_TYPE_MAP = {
    "upsc": "UPSC", "ssc": "SSC",
    "rrb": "Railways", "railway": "Railways",
    "ibps": "Banking", "sbi": "Banking", "bank": "Banking",
    "defence": "Defence", "drdo": "Defence", "army": "Defence",
    "teaching": "Teaching", "professor": "Teaching",
    "police": "Police", "cisf": "Police", "crpf": "Police",
    "psc": "State PSC",
}


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
        deadline = datetime.fromisoformat(deadline_str.split("T")[0])
        days_left = (deadline - datetime.utcnow()).days
        if days_left < 0:
            return "Open"
        if days_left <= 7:
            return "Closing Soon"
    except Exception:
        pass
    return "Open"


def upsert_jobs(jobs: list[dict], file_id: str, file_name: str) -> int:
    added = 0
    source_url = f"https://drive.google.com/file/d/{file_id}/view"

    for job in jobs:
        title = (job.get("job_title") or "").strip()
        org = (job.get("organization") or "").strip()
        if not title or not org:
            continue

        # Vacancy handling
        vacancies = job.get("vacancies")
        if isinstance(vacancies, str):
            m = re.search(r'\d+', vacancies)
            vacancies = int(m.group()) if m else None
        vacancies_display = str(vacancies) if vacancies else "See notification"

        deadline = job.get("application_deadline")
        if deadline and len(deadline) > 10:
            deadline = deadline[:10]

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
            "notification_url": source_url,
            "apply_url": source_url,
            "source": f"Employment News PDF — {file_name}",
            "created_at": datetime.utcnow().isoformat() + "Z",
        }

        try:
            # Check duplicate by title + org
            existing = supabase.from_("jobs") \
                .select("id") \
                .eq("title", title) \
                .eq("organization", org) \
                .limit(1).execute()

            if existing.data:
                continue

            supabase.from_("jobs").insert(row).execute()
            added += 1
        except Exception as e:
            print(f"  ⚠ Failed to insert '{title}': {e}")

    return added


def main() -> int:
    if not FOLDER_ID:
        print("ERROR: GDRIVE_FOLDER_ID not set", file=sys.stderr)
        return 0

    print("Getting Google Drive access token…")
    token = get_access_token()

    print(f"Listing PDFs in folder {FOLDER_ID}…")
    files = list_pdfs_in_folder(token, FOLDER_ID)

    if not files:
        print("No PDF files found in folder.")
        return 0

    print(f"Found {len(files)} PDF(s).")
    total_added = 0

    for f in files:
        file_id = f["id"]
        file_name = f["name"]
        print(f"\n── {file_name} ──")

        if already_processed(file_id):
            print("  Already processed, skipping.")
            continue

        print(f"  Downloading…")
        pdf_bytes = download_pdf(token, file_id)
        text = extract_text(pdf_bytes)

        if not text.strip():
            print("  No text extracted, skipping.")
            continue

        print(f"  Extracted {len(text):,} chars.")
        jobs = extract_jobs_with_claude(text, file_name)
        print(f"  Claude found {len(jobs)} jobs.")

        added = upsert_jobs(jobs, file_id, file_name)
        print(f"  ✓ {added} new jobs added to Supabase.")
        total_added += added

    print(f"\nTotal new jobs added: {total_added}")
    return total_added


if __name__ == "__main__":
    main()
