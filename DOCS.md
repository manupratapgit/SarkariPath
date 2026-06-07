# SarkariPath — Project Reference Documentation

> Last updated: June 2025
> Use this as the canonical reference for new contributors, progress reviews, and onboarding.

---

## 1. Product Specification & PRD

### What It Is
SarkariPath is a Next.js web portal that aggregates Indian government job notifications from official sources, provides AI-powered summaries, and sends email alerts to subscribers.

### Target Audience
Job seekers preparing for UPSC, SSC, Railways, Banking (IBPS/SBI), Defence, Teaching, and State PSC examinations.

### Core Value Proposition
- Single portal for all govt. job notifications — no manual checking of 4+ sites
- AI-extracted summaries (eligibility, deadline, vacancies) from dense government PDFs
- Email digest so users never miss a deadline
- Filter and search by exam type, location, status, qualification

---

## 2. Features — Live vs Planned

| Feature | Status | Notes |
|---|---|---|
| Home page (hero, stats, jobs grid) | ✅ Live | ISR, revalidates every 1 hour |
| Jobs listing with filters + pagination | ✅ Live | 8 filter types, sort, 20/50 per page |
| Job detail page | ✅ Live | AI summary, deadline countdown, official links |
| Alert Banner (email subscribe) | ✅ Live | Orange banner on home, wired to /api/subscribe |
| Newsletter subscription (welcome email) | ✅ Live | Requires GMAIL_USER/GMAIL_PASS in Vercel env |
| Weekly newsletter digest | ✅ Live | Triggered by GitHub Actions cron |
| Vercel Analytics | ✅ Live | Tracks all page views |
| About / Contact / Privacy / Terms pages | ✅ Live | Minimal stub pages |
| Application Tracker | ⚠️ UI only | Page exists at /tracker but non-functional |
| Login / User profiles | ❌ Not built | |
| Profile-based eligibility matching | ❌ Not built | isEligible hardcoded to false |

---

## 3. Technical Specifications

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.7, React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Email | Nodemailer via Gmail |
| Scraping | Python 3.11 + Anthropic Claude API + pdfplumber + BeautifulSoup |
| Hosting | Vercel |
| Analytics | Vercel Analytics |
| Automation | GitHub Actions |

### Route Map

```
/                         Home — hero, alert banner, job grid, features, newsletter
/jobs                     Job listing with filters, search, pagination
/jobs/[id]                Job detail page
/tracker                  Application tracker (UI only, non-functional)
/about                    About page
/contact                  Contact page
/privacy                  Privacy Policy
/terms                    Terms of Use

/api/jobs                 GET  — search/filter jobs (q, examType, status, sort, page, pageSize)
/api/jobs/counts          GET  — returns filter badge counts (exam_type, status)
/api/subscribe            POST — newsletter signup (email, name, preferences[])
/api/send-digest          POST — trigger weekly digest email to all active subscribers
```

---

## 4. Database Schema

### Table: `jobs`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text NOT NULL | |
| organization | text NOT NULL | |
| category | text | Default: 'General' |
| exam_type | text NOT NULL | UPSC, SSC, Railways (RRB), Banking (IBPS/SBI), Defence, Teaching, State PSC |
| vacancies | integer | Nullable |
| vacancies_display | text | Overrides vacancies for display (e.g. "UR-10, OBC-4") |
| eligibility | text | |
| last_date | timestamptz | Application deadline (migrated from text in migration 003) |
| ai_summary | text | Claude-generated summary |
| location | text | Default: 'All India' |
| status | text | Open / Closing Soon / Result Out / Admit Card Out |
| notification_url | text | Link to official PDF |
| apply_url | text | Link to application form |
| age_limit | text | |
| source | text | Employment News / SSC Website / UPSC Website / IBPS Website |
| details | text | JSON-encoded extra fields (qualification, age, deadline, etc.) |
| created_at | timestamptz | Default: now() |

**RLS**: Public SELECT enabled. No public write.

### Table: `subscriptions`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text UNIQUE NOT NULL | |
| name | text | |
| preferences | jsonb | Array of exam type strings e.g. ["UPSC","SSC"] |
| subscribed_at | timestamptz | Default: now() |
| is_active | boolean | Default: true |

**Indexes**: `subscriptions_email_idx`, `subscriptions_active_idx (WHERE is_active = true)`

### Migrations Log

| File | What It Does |
|---|---|
| `supabase/schema.sql` | Initial jobs table + RLS |
| `supabase/migrations/002_subscriptions.sql` | Subscriptions table |
| `supabase/add_vacancies_display.sql` | ALTER: add vacancies_display column |
| `supabase/add_details_column.sql` | ALTER: add details column |
| `supabase/migrations/003_last_date_to_timestamptz.sql` | ALTER: last_date text → timestamptz |

> **Action required**: Run migration 003 manually in the Supabase SQL editor.

---

## 5. Data Sources & Cron Timings

### Data Sources

| Source | URL | Method | Exam Type Tag |
|---|---|---|---|
| Employment News | employmentnews.gov.in | Download latest PDF → pdfplumber → Claude AI | Mixed |
| UPSC | upsc.gov.in/examinations/active-examinations | Scrape PDFs → Claude AI | UPSC |
| SSC | ssc.gov.in/portal/latestnotice | Scrape PDFs → Claude AI | SSC |
| IBPS | ibps.in | Scrape PDFs → Claude AI | Banking (IBPS/SBI) |

### Scraper Pipeline (per source)
1. Fetch listing page → find latest PDF links
2. Download PDF → extract text with `pdfplumber`
3. Send extracted text to Claude API → receive structured JSON
4. Map fields: title, org, vacancies, eligibility, deadline, location, ai_summary
5. Upsert into Supabase `jobs` table (skip duplicates by title + org)

### GitHub Actions Cron Schedule

| Workflow | Schedule (cron) | Time (IST) | What runs |
|---|---|---|---|
| `job-scraper-daily.yml` | `30 4 * * *` | 10:00 AM daily | UPSC + IBPS scrapers |
| `job-scraper.yml` | `0 1 * * 1` | 6:30 AM every Monday | All 4 scrapers (Employment News, UPSC, SSC, IBPS) |
| `newsletter-digest.yml` | `0 6 * * *` | 11:30 AM daily | POST /api/send-digest → emails all active subscribers |

All workflows support manual `workflow_dispatch` from the GitHub Actions tab.

### Required GitHub Secrets

| Secret | Used By |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Both scraper workflows |
| `SUPABASE_SERVICE_ROLE_KEY` | Both scraper workflows |
| `ANTHROPIC_API_KEY` | Both scraper workflows |
| `NEXT_PUBLIC_APP_URL` | newsletter-digest.yml (e.g. `https://sarkari-path.vercel.app`) |

### Required Vercel Environment Variables

| Variable | Used By |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | App (client + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | /api/send-digest |
| `GMAIL_USER` | /api/subscribe, /api/send-digest |
| `GMAIL_PASS` | /api/subscribe, /api/send-digest |

---

## 6. Component Map

### Pages (`src/app/`)

| Page | Type | Description |
|---|---|---|
| `page.tsx` | Server (ISR 1hr) | Home — hero, alert banner, latest 6 jobs, features, newsletter |
| `jobs/page.tsx` | Client | Jobs listing with sidebar filters, search, sort, pagination |
| `jobs/[id]/page.tsx` | Server | Job detail — AI summary, stats, official links, deadline countdown |
| `tracker/page.tsx` | Client | Application tracker (empty state only, not functional) |
| `about/page.tsx` | Server | About page |
| `contact/page.tsx` | Server | Contact page |
| `privacy/page.tsx` | Server | Privacy policy |
| `terms/page.tsx` | Server | Terms of use |

### Shared Components (`src/components/`)

| Component | Description |
|---|---|
| `Navbar.tsx` | Sticky header, logo, nav links, mobile hamburger |
| `Footer.tsx` | Dark footer, brand, filtered job links, company links |
| `HeroSection.tsx` | Landing hero with search, quick exam tags |
| `StatsRow.tsx` | 4 stat boxes (jobs count, sources, frequency, price) |
| `AlertBanner.tsx` | Orange alert section — email subscribe wired to /api/subscribe |
| `JobsGrid.tsx` | Server component, fetches 6 latest jobs, renders JobCard grid |
| `JobCard.tsx` | Job card for grid view (home page) |
| `FeaturesSection.tsx` | 3 feature cards (AI summaries, official sources, tracker) |
| `NewsletterSection.tsx` | Full newsletter signup with exam preferences multiselect |

### Jobs Page Components (`src/app/jobs/`)

| Component | Description |
|---|---|
| `JobListCard.tsx` | Job card for list view — Track/Save/Notify/Apply buttons |
| `JobsFilterSidebar.tsx` | Sidebar with 6 filter groups + count badges |
| `ActiveFilterPills.tsx` | Pill badges for active filters with X to remove |
| `Pagination.tsx` | Prev/Next + numbered pages with smart ellipsis |

---

## 7. Known Issues & Open Tasks

### High Priority
| Issue | Location | Fix |
|---|---|---|
| `GMAIL_USER` / `GMAIL_PASS` missing from Vercel env | /api/subscribe, /api/send-digest | Add to Vercel Environment Variables |
| Run migration 003 in Supabase | last_date column is still text in production | Execute `supabase/migrations/003_last_date_to_timestamptz.sql` |

### Medium Priority
| Issue | Location | Notes |
|---|---|---|
| Subscriptions RLS allows public DELETE | Supabase | Any user can delete others' subscriptions via anon key |
| No rate limiting on /api/subscribe | API | Vulnerable to email spam |
| Jobs table has no query indexes | Supabase | `.ilike()` will slow at scale; add indexes on exam_type, status, created_at |
| Newsletter sends emails sequentially | /api/send-digest | Will time out at scale; should use Promise.all() or queue |

### Low Priority
| Issue | Notes |
|---|---|
| Tracker page non-functional | Build with localStorage or Supabase user table |
| isEligible hardcoded to false | Wire up to user profile when auth is built |
| `resend` npm package unused | Remove package and RESEND_API_KEY env var |

---

## 8. Redundant / Dead Code

| Item | Status | Action |
|---|---|---|
| `src/components/FilterSidebar.tsx` | Deleted ✅ | Was duplicate of JobsFilterSidebar |
| `fetchJobById()` in `src/lib/api.ts` | Deleted ✅ | No API endpoint existed |
| `scrapers/fix_vacancies.py` | Still present | One-off utility, not called by run_all.py — archive or delete |
| `scrapers/seed_supabase.py` | Still present | One-off seeder — archive or delete |
| `resend` npm dependency | Still present | Imported but never used — remove |
| `SCRAPER_CRON` in .env.local | Still present | Set but never read — remove |

---

## 9. How It Works — End-to-End

```
┌─────────────────────────────────────────────┐
│  GitHub Actions                              │
│  Daily 10 AM IST → UPSC + IBPS scrapers     │
│  Monday 6:30 AM IST → All 4 scrapers        │
└──────────────────────┬──────────────────────┘
                       │
         Download PDF → pdfplumber → Claude API
         → Structured JSON → Supabase jobs table
                       │
        ┌──────────────▼──────────────────────┐
        │           Supabase DB               │
        │     jobs table  subscriptions table │
        └───────┬─────────────────┬───────────┘
                │                 │
     ┌──────────▼───────┐  ┌──────▼──────────────────┐
     │  Next.js App     │  │  GitHub Actions           │
     │  Vercel CDN      │  │  Daily 11:30 AM IST       │
     │  /jobs, /jobs/id │  │  POST /api/send-digest    │
     │  /api/jobs       │  │  → Gmail → all subscribers│
     └──────────────────┘  └───────────────────────────┘
```

---

## 10. External Services

| Service | Purpose | Credentials |
|---|---|---|
| Supabase | Database | NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY |
| Anthropic Claude API | AI extraction from PDFs | ANTHROPIC_API_KEY (GitHub secret only) |
| Gmail | Transactional + digest emails | GMAIL_USER, GMAIL_PASS |
| Vercel | Hosting + Analytics | Auto-configured on deploy |
| GitHub Actions | Cron job runner | Secrets in repo settings |

---

## 11. Deployment

1. Push to `main` → Vercel auto-deploys
2. GitHub Actions workflows run on their respective cron schedules
3. To trigger scrapers or digest manually: GitHub → Actions tab → select workflow → Run workflow

### Adding a new scraper
1. Create `scrapers/<source>.py` with a `main() -> int` function
2. Add to `SCRAPERS` list in `scrapers/run_all.py`
3. If it should run daily, add it to `job-scraper-daily.yml`
