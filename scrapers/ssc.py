"""
SSC job scraper — scrapes active notifications from ssc.gov.in
"""

import re
import json
import hashlib
from datetime import datetime
from dataclasses import dataclass, asdict

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://ssc.gov.in"
NOTICES_URL = f"{BASE_URL}/Portal/Notices"

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
    raw = raw.strip()
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d %B %Y", "%B %d, %Y"):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return raw


def _infer_education(title: str) -> list[str]:
    title_lower = title.lower()
    if any(k in title_lower for k in ("graduate", "degree", "b.sc", "b.com", "b.a")):
        return ["Graduate"]
    if any(k in title_lower for k in ("12th", "intermediate", "senior secondary")):
        return ["12th Pass"]
    if any(k in title_lower for k in ("10th", "matriculation", "matric")):
        return ["10th Pass"]
    return ["Graduate"]


def scrape() -> list[dict]:
    try:
        resp = requests.get(NOTICES_URL, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"[SSC] Request failed: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    jobs: list[Job] = []

    for item in soup.select(".notice-item, tr"):
        cells = item.find_all("td") if item.name == "tr" else [item]
        if not cells:
            continue

        title_el = cells[0]
        title = title_el.get_text(strip=True)
        if not title or len(title) < 10:
            continue

        link_tag = title_el.find("a", href=True)
        if not link_tag:
            continue

        href = link_tag["href"]
        notification_url = href if href.startswith("http") else BASE_URL + href

        # Last date: look for explicit cell or pattern in title
        last_date = ""
        if len(cells) >= 3:
            last_date = _parse_date(cells[-1].get_text(strip=True))
        if not last_date:
            date_match = re.search(r"\d{2}[/-]\d{2}[/-]\d{4}", title)
            last_date = _parse_date(date_match.group()) if date_match else ""

        vacancy_match = re.search(r"(\d[\d,]*)\s*(?:posts?|vacancies)", title, re.IGNORECASE)
        vacancies = int(vacancy_match.group(1).replace(",", "")) if vacancy_match else 0

        job = Job(
            id=_make_id(title, last_date),
            title=title,
            organization="Staff Selection Commission",
            category="Central Government",
            vacancies=vacancies,
            last_date=last_date,
            notification_url=notification_url,
            apply_url=f"{BASE_URL}/Portal/Home",
            education_required=_infer_education(title),
            state="All India",
            posted_at=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        )
        jobs.append(job)

    print(f"[SSC] Scraped {len(jobs)} jobs")
    return [asdict(j) for j in jobs]


if __name__ == "__main__":
    results = scrape()
    print(json.dumps(results, indent=2))
