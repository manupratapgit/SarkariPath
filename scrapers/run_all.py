"""
Run all SarkariPath scrapers in sequence and print a combined summary.

Run: python3 scrapers/run_all.py
"""

from __future__ import annotations

import sys
import time
import traceback
from pathlib import Path

# Ensure scrapers/ is importable
sys.path.insert(0, str(Path(__file__).parent))

SCRAPERS = [
    ("Employment News", "employment_news"),
    ("UPSC",           "upsc"),
    ("SSC",            "ssc"),
    ("IBPS",           "ibps"),
]


def run_scraper(name: str, module_name: str) -> int:
    print("\n" + "=" * 60)
    print(f"  Running: {name}")
    print("=" * 60)
    start = time.time()
    try:
        mod = __import__(module_name)
        added = mod.main()
        elapsed = time.time() - start
        print(f"\n  ✓ {name}: {added} new job(s) added ({elapsed:.0f}s)")
        return added
    except Exception:
        elapsed = time.time() - start
        print(f"\n  ✗ {name}: FAILED after {elapsed:.0f}s")
        traceback.print_exc()
        return 0


def main() -> None:
    overall_start = time.time()
    results: list[tuple[str, int]] = []

    for name, module_name in SCRAPERS:
        added = run_scraper(name, module_name)
        results.append((name, added))

    total_elapsed = time.time() - overall_start
    total_added = sum(n for _, n in results)

    print("\n" + "=" * 60)
    print("  COMBINED SUMMARY")
    print("=" * 60)
    for name, added in results:
        status = "✓" if added >= 0 else "✗"
        print(f"  {status} {name:<20} {added} new job(s)")
    print(f"\n  Total new jobs: {total_added}")
    print(f"  Total time:     {total_elapsed:.0f}s")
    print("=" * 60)


if __name__ == "__main__":
    main()
