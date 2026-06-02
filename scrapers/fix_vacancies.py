"""
Fix null vacancies in employment_news.json by extracting counts from
title and notes using pattern matching.

Run: python3 scrapers/fix_vacancies.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

DATA_FILE = Path(__file__).parent / "output" / "employment_news.json"


def extract_vacancies(title: str, notes: str) -> int | None:
    text = (title + " " + notes).lower()

    # Pattern: "x2", "(x9)", "x 4" in title
    m = re.search(r'\bx\s*(\d+)\b', title, re.I)
    if m:
        return int(m.group(1))

    # Pattern: "17 posts", "(9 posts)", "4 posts across"
    m = re.search(r'\(?\s*(\d+)\s+posts?\b', title, re.I)
    if m:
        return int(m.group(1))

    # Pattern: sum of category breakdown in notes e.g. "UR-04, EWS-01, OBC-02, SC-01, ST-01, PwBD-01"
    cats = re.findall(r'\b(?:UR|EWS|OBC|SC|ST|PwBD|OH|VH|HH|Gen)\s*[-–]\s*(\d+)', notes, re.I)
    if cats:
        return sum(int(c) for c in cats)

    # Pattern: "x2", "x4" anywhere in notes
    m = re.search(r'\bx\s*(\d+)\b', notes, re.I)
    if m:
        return int(m.group(1))

    # Pattern: "(\d+) posts" in notes
    m = re.search(r'\b(\d+)\s+posts?\b', notes, re.I)
    if m:
        n = int(m.group(1))
        if 1 <= n <= 500:  # sanity check
            return n

    # Pattern: "(\d+) vacancies" in notes
    m = re.search(r'\b(\d+)\s+vacanc', notes, re.I)
    if m:
        return int(m.group(1))

    # Pattern: "(x) positions" in notes
    m = re.search(r'\b(\d+)\s+positions?\b', notes, re.I)
    if m:
        n = int(m.group(1))
        if 1 <= n <= 500:
            return n

    return None


def main():
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    jobs = data["jobs"]

    fixed = 0
    for job in jobs:
        if job.get("vacancies") is not None:
            continue  # already has a value

        title = job.get("job_title") or ""
        notes = job.get("notes") or ""
        result = extract_vacancies(title, notes)
        if result is not None:
            job["vacancies"] = result
            fixed += 1
            print(f"  Fixed: {title[:60]} → {result} vacancies")

    data["jobs"] = jobs
    DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    still_null = sum(1 for j in jobs if j.get("vacancies") is None)
    print(f"\nDone. Fixed {fixed} jobs. Still null: {still_null} (genuinely unspecified).")
    print(f"Saved → {DATA_FILE}")
    print("\nNow re-run: python3 scrapers/seed_supabase.py")


if __name__ == "__main__":
    main()
