"""
UPSC job scraper — scrapes active notifications from upsc.gov.in
"""

import re
import json
import hashlib
from datetime import datetime
from dataclasses import dataclass, asdict

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://upsc.gov.in"
NOTIFICATIONS_URL = f"{BASE_URL}/recruitment"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SarkariPathBot/1.0)",
}


@dataclass
class Job:
    id: str
    title: str
    organization: str
    category: str
    vacancies: int
    last_date: str
    notification_url: str
    apply_url: str
    education_required: list[str]
    state: str
    posted_at: str


def _make_id(title: str, last_date: str) -> str:
    key = f"{title.lower().strip()}-{last_date}"
    return hashlib.md5(key.encode()).hexdigest()[:12]


def _parse_date(raw: str) -> str:
    """Normalise various date formats to YYYY-MM-DD."""
    raw = raw.strip()
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d %B %Y", "%B %d, %Y"):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return raw


def scrape() -> list[dict]:
    try:
        resp = requests.get(NOTIFICATIONS_URL, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"[UPSC] Request failed: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    jobs: list[Job] = []

    for row in soup.select("table tr"):
        cells = row.find_all("td")
        if len(cells) < 3:
            continue

        title_cell = cells[0]
        title = title_cell.get_text(strip=True)
        if not title:
            continue

        link_tag = title_cell.find("a", href=True)
        notification_url = BASE_URL + link_tag["href"] if link_tag else ""

        last_date_raw = cells[-1].get_text(strip=True)
        last_date = _parse_date(last_date_raw)

        # Extract vacancy count from title if present (e.g. "300 Posts")
        vacancy_match = re.search(r"(\d[\d,]*)\s*(?:posts?|vacancies)", title, re.IGNORECASE)
        vacancies = int(vacancy_match.group(1).replace(",", "")) if vacancy_match else 0

        job = Job(
            id=_make_id(title, last_date),
            title=title,
            organization="Union Public Service Commission",
            category="Central Government",
            vacancies=vacancies,
            last_date=last_date,
            notification_url=notification_url,
            apply_url=f"{BASE_URL}/apply",
            education_required=["Graduate"],
            state="All India",
            posted_at=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        )
        jobs.append(job)

    print(f"[UPSC] Scraped {len(jobs)} jobs")
    return [asdict(j) for j in jobs]


if __name__ == "__main__":
    results = scrape()
    print(json.dumps(results, indent=2))
