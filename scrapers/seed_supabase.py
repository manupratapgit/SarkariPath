"""
Seed script — reads employment_news.json and upserts all jobs into Supabase.
Run: python3 scrapers/seed_supabase.py
Requires: pip install supabase
"""

from __future__ import annotations

import json
import os
import re
import uuid
import urllib.parse
from pathlib import Path
from typing import Optional
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

# Known org → official recruitment/careers URL
ORG_URL_MAP = {
    "upsc": "https://upsconline.nic.in",
    "union public service commission": "https://upsconline.nic.in",
    "ssc": "https://ssc.nic.in",
    "staff selection commission": "https://ssc.nic.in",
    "rrb": "https://indianrailways.gov.in/railwayboard/view_section.jsp?lang=0&id=0,1,304,366,533",
    "railway recruitment": "https://www.rrbapply.gov.in",
    "coal india": "https://www.coalindia.in/en-us/career/recruitment.aspx",
    "nhpc": "https://www.nhpcindia.com/career.aspx",
    "ntpc": "https://www.ntpc.co.in/en/careers",
    "icar": "https://icar.org.in/content/vacancies",
    "iari": "https://www.iari.res.in/index.php?option=com_content&view=article&id=245",
    "drdo": "https://www.drdo.gov.in/careers",
    "aiims": "https://www.aiimsexams.ac.in",
    "tata memorial": "https://tmc.gov.in/index.php/careers",
    "sbi": "https://bank.sbi/web/careers",
    "pnb": "https://www.pnbindia.in/recruitment.html",
    "apeda": "https://apeda.gov.in/apedawebsite/Vacancies/Vacancies.htm",
    "cisf": "https://cisfrectt.cisf.gov.in",
    "nhsrc": "https://nhsrcindia.org/career",
    "nhrc": "https://nhrc.nic.in/jobs-recruitment",
    "nsic": "https://www.nsic.co.in/Careers.aspx",
    "iim": "https://www.iimshillong.ac.in/jobs",
    "igidr": "http://www.igidr.ac.in/careers/",
    "nsi": "http://nsi.gov.in",
    "national sugar institute": "http://nsi.gov.in",
    "ugc": "https://ugcdaecsr.in",
    "vecc": "https://www.vecc.gov.in/careers.php",
    "wdra": "https://wdra.gov.in/wdra/recruitment",
    "odisha state open university": "https://osou.ac.in/recruitments.php",
    "central university of rajasthan": "https://www.curaj.ac.in/recruitment",
    "sagarmala": "https://sagarmala.gov.in/careers",
    "balmer lawrie": "https://www.balmerlawrie.com/careers",
    "dsiidc": "https://dsiidc.org/recruitment/",
}


def infer_exam_type(title: str, org: str) -> str:
    text = (title + " " + org).lower()
    for key, val in EXAM_TYPE_MAP.items():
        if key in text:
            return val
    return "UPSC"


def infer_status(deadline_str: Optional[str]) -> str:
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


def parse_deadline(deadline_str: Optional[str]) -> Optional[str]:
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


def extract_url_from_text(text: str) -> Optional[str]:
    """Extract best URL from text — prefers gov.in / ac.in / nic.in."""
    if not text:
        return None
    # Full http/https URLs
    urls = re.findall(r'https?://[^\s,)\]\"\']+', text)
    for u in urls:
        if any(x in u for x in [".gov.in", ".ac.in", ".nic.in", ".org.in", ".res.in"]):
            return u.rstrip(".,)")
    if urls:
        return urls[0].rstrip(".,)")
    # Bare domains like www.xyz.gov.in
    bare = re.findall(r'www\.[a-z0-9\-]+\.[a-z.]{2,10}(?:/[^\s,)]*)?', text)
    for b in bare:
        return "https://" + b.rstrip(".,)")
    return None


def org_url(org: str) -> Optional[str]:
    """Look up known org → official URL."""
    org_lower = org.lower()
    for key, url in ORG_URL_MAP.items():
        if key in org_lower:
            return url
    return None


def google_search_url(title: str, org: str, kind: str = "apply") -> str:
    query = urllib.parse.quote_plus(f"{title} {org} {kind} official site")
    return f"https://www.google.com/search?q={query}"


def transform(raw: dict, idx: int) -> dict:
    title = raw.get("job_title") or "Untitled"
    org = raw.get("organization") or ""
    notes = raw.get("notes") or ""
    qualification = raw.get("qualification") or ""
    slug = slugify(title) + f"-{idx}"
    deadline_raw = raw.get("application_deadline")
    deadline = parse_deadline(deadline_raw)

    # Extract URLs from notes + qualification combined
    combined_text = notes + " " + qualification
    extracted_url = extract_url_from_text(combined_text)
    known_org_url = org_url(org)

    # notification_url: extracted > known org > employmentnews fallback
    notification_url = extracted_url or known_org_url or "https://www.employmentnews.gov.in"

    # apply_url: for UPSC posts always upsconline; extracted > known org > google search
    is_upsc = "upsc" in (title + org).lower()
    if is_upsc:
        apply_url = "https://upsconline.nic.in"
    else:
        apply_url = extracted_url or known_org_url or google_search_url(title, org, "apply online")

    # Full details text for the details page
    details = json.dumps({
        "qualification": raw.get("qualification"),
        "age_limit": raw.get("age_limit"),
        "application_deadline": raw.get("application_deadline"),
        "location": raw.get("location"),
        "notes": notes,
        "vacancies": raw.get("vacancies"),
        "source": "Employment News 23-29 May 2026",
    }, ensure_ascii=False)

    return {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, slug)),
        "title": title[:255],
        "organization": org[:255],
        "category": "General",
        "exam_type": infer_exam_type(title, org),
        "vacancies": raw.get("vacancies"),
        "eligibility": qualification[:500],
        "last_date": deadline,
        "ai_summary": (notes or qualification)[:600],
        "location": (raw.get("location") or "All India")[:255],
        "status": infer_status(deadline_raw),
        "notification_url": notification_url,
        "apply_url": apply_url,
        "age_limit": (raw.get("age_limit") or "")[:100],
        "source": "Employment News 23-29 May 2026",
        "details": details,
        "vacancies_display": raw.get("vacancies_display") or ("See notification" if raw.get("vacancies") is None else str(raw.get("vacancies"))),
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
        print(f"  • {r['title'][:55]} | apply: {r['apply_url'][:60]}")


if __name__ == "__main__":
    main()
