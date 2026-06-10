"""
Status updater — checks admit card and result announcement pages for UPSC, SSC, IBPS,
then updates matching job rows in Supabase (status → "Admit Card Out" or "Result Out").
Only processes jobs currently in "Open" or "Closing Soon" status to avoid double-updates.
"""

from __future__ import annotations

import os
import re
import sys
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from supabase import create_client

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}
TIMEOUT = 20


# ── Scrapers ─────────────────────────────────────────────────────────────────

def _get_text(url: str) -> str:
    try:
        r = requests.get(url, headers=HEADERS, timeout=TIMEOUT, verify=False)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"  ⚠ Could not fetch {url}: {e}")
        return ""


def scrape_upsc_updates() -> list[dict]:
    """Return list of {title, url, kind} from UPSC active/recent notices."""
    results = []
    for url, kind in [
        ("https://upsc.gov.in/examinations/admit-cards", "Admit Card Out"),
        ("https://upsc.gov.in/examinations/written-results", "Result Out"),
        ("https://upsc.gov.in/examinations/final-results", "Result Out"),
    ]:
        html = _get_text(url)
        if not html:
            continue
        soup = BeautifulSoup(html, "lxml")
        for a in soup.select("a[href]"):
            text = a.get_text(strip=True)
            if len(text) > 10:
                results.append({"title": text, "url": a["href"], "kind": kind})
    return results


def scrape_ssc_updates() -> list[dict]:
    results = []
    for url, kind in [
        ("https://ssc.gov.in/portal/admitcard", "Admit Card Out"),
        ("https://ssc.gov.in/portal/result", "Result Out"),
    ]:
        html = _get_text(url)
        if not html:
            continue
        soup = BeautifulSoup(html, "lxml")
        for a in soup.select("a[href]"):
            text = a.get_text(strip=True)
            if len(text) > 10:
                results.append({"title": text, "url": a["href"], "kind": kind})
    return results


def scrape_ibps_updates() -> list[dict]:
    results = []
    html = _get_text("https://www.ibps.in/")
    if not html:
        return results
    soup = BeautifulSoup(html, "lxml")
    for a in soup.select("a[href]"):
        text = a.get_text(strip=True).lower()
        if "admit" in text or "call letter" in text:
            results.append({"title": a.get_text(strip=True), "url": a["href"], "kind": "Admit Card Out"})
        elif "result" in text or "score card" in text:
            results.append({"title": a.get_text(strip=True), "url": a["href"], "kind": "Result Out"})
    return results


# ── Matching ──────────────────────────────────────────────────────────────────

def _keywords(text: str) -> set[str]:
    """Extract meaningful keywords (3+ chars) from a string."""
    return {w.lower() for w in re.findall(r"[A-Za-z]{3,}", text)}


def find_matching_jobs(notice_title: str) -> list[dict]:
    """Find DB jobs whose title overlaps significantly with the notice title."""
    notice_kw = _keywords(notice_title)
    # Fetch jobs that are still open (not already updated)
    result = supabase.from_("jobs") \
        .select("id,title,organization,status") \
        .in_("status", ["Open", "Closing Soon"]) \
        .execute()

    matches = []
    for job in (result.data or []):
        job_kw = _keywords(job["title"] + " " + job["organization"])
        overlap = notice_kw & job_kw
        # Require at least 2 meaningful overlapping words
        if len(overlap) >= 2:
            matches.append(job)
    return matches


def update_job_status(job_id: str, new_status: str) -> None:
    supabase.from_("jobs").update({
        "status": new_status,
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }).eq("id", job_id).execute()


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    print("Collecting admit card / result notices…")
    all_notices: list[dict] = []
    for name, fn in [("UPSC", scrape_upsc_updates), ("SSC", scrape_ssc_updates), ("IBPS", scrape_ibps_updates)]:
        notices = fn()
        print(f"  {name}: {len(notices)} notices found")
        all_notices.extend(notices)

    if not all_notices:
        print("No notices found.")
        return 0

    updated = 0
    seen_job_ids: set[str] = set()

    for notice in all_notices:
        matches = find_matching_jobs(notice["title"])
        for job in matches:
            if job["id"] in seen_job_ids:
                continue
            seen_job_ids.add(job["id"])
            try:
                update_job_status(job["id"], notice["kind"])
                print(f"  ✓ Updated '{job['title']}' → {notice['kind']}")
                updated += 1
            except Exception as e:
                print(f"  ⚠ Failed to update '{job['title']}': {e}")

    print(f"\nTotal jobs status-updated: {updated}")
    return updated


if __name__ == "__main__":
    main()
