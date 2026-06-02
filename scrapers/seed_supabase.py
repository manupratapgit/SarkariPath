"""
Seed script — reads employment_news.json and upserts all jobs into Supabase.
Run: python scrapers/seed_supabase.py
Requires: pip install supabase
"""

import json
import os
import re
import uuid
from pathlib import Path
from supabase import create_client

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://impjnmmwjrvhlrrtkomh.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcGpubW13anJ2aGxycnRrb21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTQ1MjEsImV4cCI6MjA5NTk5MDUyMX0.MSqyZ6BCj5PJ9nacSpOFCM7zQ42gcZkZotcCiq4nBec",
)

DATA_FILE = Path(__file__).parent / "output" / "employment_news.json"

EXAM_TYPE_MAP = {
    "upsc": "UPSC",
    "ssc": "SSC",
    "rrb": "Railways (RRB)", "railway": "Railways (RRB)", "railways": "Railways (RRB)",
    "ibps": "Banking (IBPS/SBI)", "sbi": "Banking (IBPS/SBI)", "bank": "Banking (IBPS/SBI)",
    "defence": "Defence", "drdo": "Defence", "army": "Defence", "navy": "Defence", "air force": "Defence",
    "teaching": "Teaching (DSSSB/KVS)", "professor": "Teaching (DSSSB/KVS)", "faculty": "Teaching (DSSSB/KVS)",
    "police": "Police", "nia": "Police", "cisf": "Police", "crpf": "Police",
    "psc": "State PSC",
    "ntpc": "Railways (RRB)",
    "icar": "Research",
}

STATUS_MAP = {
    "closing soon": "Closing Soon",
    "result out": "Result Out",
    "admit card": "Admit Card Out",
}


def infer_exam_type(title: str, org: str) -> str:
    text = (title + " " + org).lower()
    for key, val in EXAM_TYPE_MAP.items():
        if key in text:
            return val
    return "UPSC"


def infer_status(deadline_str: str | None) -> str:
    if not deadline_str:
        return "Open"
    from datetime import datetime
    months = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    }
    s = deadline_str.lower()
    try:
        d = datetime.fromisoformat(s)
    except Exception:
        # try "10 June 2026"
        m = re.search(r"(\d{1,2})\s+(\w+)\s+(\d{4})", s)
        if m:
            day, mon, year = int(m.group(1)), months.get(m.group(2)[:3], 1), int(m.group(3))
            try:
                d = datetime(year, mon, day)
            except Exception:
                return "Open"
        else:
            return "Open"
    now = datetime.utcnow()
    diff = (d - now).days
    if diff < 0:
        return "Open"
    if diff <= 7:
        return "Closing Soon"
    return "Open"


def slugify(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", text.lower())
    s = re.sub(r"[\s_]+", "-", s)
    return s[:80]


def parse_deadline(deadline_str: str | None) -> str | None:
    if not deadline_str:
        return None
    months = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    }
    s = deadline_str.strip()
    try:
        from datetime import datetime
        datetime.fromisoformat(s)
        return s
    except Exception:
        pass
    m = re.search(r"(\d{1,2})\s+(\w+)\s+(\d{4})", s)
    if m:
        day, mon_str, year = int(m.group(1)), m.group(2)[:3].lower(), int(m.group(3))
        mon = months.get(mon_str)
        if mon:
            return f"{year:04d}-{mon:02d}-{day:02d}"
    return s


def transform(raw: dict, idx: int) -> dict:
    title = raw.get("job_title") or "Untitled"
    org = raw.get("organization") or ""
    slug = slugify(title) + f"-{idx}"
    deadline_raw = raw.get("application_deadline")
    deadline = parse_deadline(deadline_raw)

    return {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, slug)),
        "title": title[:255],
        "organization": org[:255],
        "category": "General",
        "exam_type": infer_exam_type(title, org),
        "vacancies": raw.get("vacancies"),
        "eligibility": (raw.get("qualification") or "")[:500],
        "last_date": deadline,
        "ai_summary": (raw.get("notes") or raw.get("qualification") or "")[:600],
        "location": (raw.get("location") or "All India")[:255],
        "status": infer_status(deadline_raw),
        "notification_url": "https://www.employmentnews.gov.in",
        "apply_url": "https://www.employmentnews.gov.in",
        "age_limit": (raw.get("age_limit") or "")[:100],
        "source": "Employment News 23-29 May 2026",
    }


def main():
    data = json.loads(DATA_FILE.read_text())
    raw_jobs = data["jobs"]

    records = [transform(j, i) for i, j in enumerate(raw_jobs)]

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print(f"Upserting {len(records)} jobs into Supabase…")
    result = supabase.table("jobs").upsert(records).execute()
    print(f"Done. Rows affected: {len(result.data)}")

    for r in records[:5]:
        print(f"  • {r['title'][:60]} | {r['status']} | {r['last_date']}")


if __name__ == "__main__":
    main()
