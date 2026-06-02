"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobsFilterSidebar, { DEFAULT_FILTERS, type JobFilters } from "@/components/jobs/JobsFilterSidebar";
import ActiveFilterPills from "@/components/jobs/ActiveFilterPills";
import JobListCard, { type JobListItem } from "@/components/jobs/JobListCard";
import Pagination from "@/components/jobs/Pagination";

// ─── Mock data ───────────────────────────────────────────────────────────────
const ALL_JOBS: JobListItem[] = [
  {
    id: "upsc-cse-2025",
    title: "UPSC Civil Services Examination 2025",
    organization: "Union Public Service Commission",
    category: "General",
    examType: "UPSC",
    vacancies: 1056,
    eligibility: "Graduate (any discipline) · Age 21–32 yrs",
    lastDate: "2026-08-15",
    aiSummary: "Premier IAS/IPS/IFS recruitment. 3-stage process: Prelims (June), Mains (Sep), Interview. Approx 10 lakh applicants yearly — one of India's toughest exams.",
    location: "All India",
    status: "Open",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: true,
  },
  {
    id: "ssc-cgl-2025",
    title: "SSC Combined Graduate Level (CGL) 2025",
    organization: "Staff Selection Commission",
    category: "General",
    examType: "SSC",
    vacancies: 17727,
    eligibility: "Graduate · Age 18–32 yrs",
    lastDate: "2026-07-20",
    aiSummary: "Largest central govt recruitment — Inspector, Auditor, Accountant across 40+ ministries. Tier-I & II CBT followed by document verification.",
    location: "All India",
    status: "Open",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: true,
  },
  {
    id: "rrb-ntpc-2025",
    title: "RRB NTPC Graduate Posts 2025",
    organization: "Railway Recruitment Board",
    category: "OBC",
    examType: "Railways (RRB)",
    vacancies: 11558,
    eligibility: "Graduate · Age 18–33 yrs",
    lastDate: "2026-09-10",
    aiSummary: "Station Master, Goods Guard, Jr Account Assistant posts. CBT 1 → CBT 2 → Typing/Skill test. Medical fitness mandatory for operational posts.",
    location: "All India",
    status: "Open",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: false,
  },
  {
    id: "ibps-po-2025",
    title: "IBPS PO (Probationary Officer) XIV 2025",
    organization: "Institute of Banking Personnel Selection",
    category: "General",
    examType: "Banking (IBPS/SBI)",
    vacancies: 4455,
    eligibility: "Graduate · Age 20–30 yrs",
    lastDate: "2026-06-30",
    aiSummary: "PO recruitment across 11 public sector banks. Prelims → Mains → Interview. Starting CTC ₹8.2 LPA + DA, HRA. Bond period: 2 years.",
    location: "All India",
    status: "Closing Soon",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: true,
  },
  {
    id: "dsssb-tgt-2025",
    title: "DSSSB TGT / PGT Teacher Recruitment 2025",
    organization: "Delhi Subordinate Services Selection Board",
    category: "SC",
    examType: "Teaching (DSSSB/KVS)",
    vacancies: 6593,
    eligibility: "B.Ed + relevant degree · CTET mandatory · Age 18–32 yrs",
    lastDate: "2026-08-01",
    aiSummary: "Teaching posts across Delhi govt schools for classes 6–12. One-tier online exam + document verification. CTET Paper-II score mandatory.",
    location: "Delhi",
    status: "Open",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: false,
  },
  {
    id: "agniveer-army-2025",
    title: "Indian Army Agniveer Recruitment 2025",
    organization: "Indian Army — ARO",
    category: "General",
    examType: "Defence",
    vacancies: 25000,
    eligibility: "10th / 12th pass (trade-wise) · Age 17.5–23 yrs",
    lastDate: "2026-10-01",
    aiSummary: "4-year short-service tour across General Duty, Clerk, Technical, Tradesman trades. 25% retained permanently. ₹11.71 lakh Seva Nidhi on exit.",
    location: "All India",
    status: "Open",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: false,
  },
  {
    id: "bpsc-68th-2025",
    title: "BPSC 68th Combined Competitive Exam 2025",
    organization: "Bihar Public Service Commission",
    category: "ST",
    examType: "State PSC",
    vacancies: 281,
    eligibility: "Graduate (any discipline) · Age 20–37 yrs",
    lastDate: "2026-07-15",
    aiSummary: "Bihar civil services — SDM, BDO, Inspector posts. Prelims (Objective) + Mains (Descriptive) + Interview. Bihar domicile preferred for certain posts.",
    location: "Bihar",
    status: "Open",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: true,
  },
  {
    id: "rpsc-ras-2025",
    title: "RPSC RAS / RTS Combined Competitive Exam 2025",
    organization: "Rajasthan Public Service Commission",
    category: "EWS",
    examType: "State PSC",
    vacancies: 905,
    eligibility: "Graduate · Age 21–40 yrs (relaxation for reserved categories)",
    lastDate: "2026-06-25",
    aiSummary: "Rajasthan Administrative Service — District Collector, SDO posts via Prelims + Mains + Interview. Rajasthani language paper compulsory in Mains.",
    location: "Rajasthan",
    status: "Closing Soon",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: false,
  },
  {
    id: "upprpb-si-2025",
    title: "UP Police Sub-Inspector Civil Police Recruitment 2025",
    organization: "UPPRPB — Uttar Pradesh Police Recruitment Board",
    category: "OBC",
    examType: "Police",
    vacancies: 9534,
    eligibility: "Graduate · Age 21–28 yrs · Physical fitness mandatory",
    lastDate: "2026-07-31",
    aiSummary: "Sub-Inspector posts for civil, platoon commander & ASI accountant roles. Written test (400 marks) → PST/PET → Document verification → Medical exam.",
    location: "Uttar Pradesh",
    status: "Open",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: true,
  },
  {
    id: "ssc-chsl-2025",
    title: "SSC CHSL (10+2) 2025",
    organization: "Staff Selection Commission",
    category: "General",
    examType: "SSC",
    vacancies: 3712,
    eligibility: "12th Pass · Age 18–27 yrs",
    lastDate: "2026-08-20",
    aiSummary: "Lower Division Clerk, Postal/Sorting Assistant, Data Entry Operator posts across central ministries. Tier-I CBT + Tier-II (Skill/Typing) test.",
    location: "All India",
    status: "Open",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: false,
  },
  {
    id: "crpf-constable-2025",
    title: "CRPF Constable Technical & Tradesmen 2025",
    organization: "Central Reserve Police Force",
    category: "SC",
    examType: "Defence",
    vacancies: 9212,
    eligibility: "10th Pass + ITI/Trade Certificate · Age 18–23 yrs",
    lastDate: "2026-09-30",
    aiSummary: "Technical & Tradesmen posts — Cook, Cobbler, Carpenter, Tailor etc. Written exam + PET/PST + Trade Test + Medical. Physically demanding role.",
    location: "All India",
    status: "Open",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: false,
  },
  {
    id: "kvs-teacher-2025",
    title: "KVS Primary & TGT Teacher Recruitment 2025",
    organization: "Kendriya Vidyalaya Sangathan",
    category: "PwD",
    examType: "Teaching (DSSSB/KVS)",
    vacancies: 13000,
    eligibility: "B.Ed / D.El.Ed + CTET · Age 18–35 yrs",
    lastDate: "2026-08-10",
    aiSummary: "Primary Teacher (PRT) and Trained Graduate Teacher (TGT) posts across 1200+ Kendriya Vidyalayas. Written test + Interview. All-India posting.",
    location: "All India",
    status: "Result Out",
    notificationUrl: "#",
    applyUrl: "#",
    isEligible: true,
  },
];

const PAGE_SIZE = 8;
const SORT_OPTIONS = [
  { value: "latest", label: "Latest First" },
  { value: "deadline", label: "Deadline (Soonest)" },
  { value: "vacancies", label: "Most Vacancies" },
  { value: "eligible", label: "Eligible Jobs First" },
];

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter + sort logic
  const filteredJobs = useMemo(() => {
    let jobs = ALL_JOBS.filter((j) => {
      if (query) {
        const q = query.toLowerCase();
        if (
          !j.title.toLowerCase().includes(q) &&
          !j.organization.toLowerCase().includes(q) &&
          !j.examType.toLowerCase().includes(q)
        )
          return false;
      }
      if (filters.examType.length && !filters.examType.includes(j.examType)) return false;
      if (filters.qualification.length) {
        /* simplified: just pass through without real user profile matching */
      }
      if (filters.location.length && !filters.location.includes(j.location)) return false;
      if (filters.status.length && !filters.status.includes(j.status)) return false;
      if (filters.category.length && !filters.category.includes(j.category)) return false;
      return true;
    });

    jobs = [...jobs].sort((a, b) => {
      if (sort === "deadline") return new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime();
      if (sort === "vacancies") return b.vacancies - a.vacancies;
      if (sort === "eligible") return (b.isEligible ? 1 : 0) - (a.isEligible ? 1 : 0);
      return 0; // latest: keep original order
    });

    return jobs;
  }, [query, filters, sort]);

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const paginatedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (f: JobFilters) => { setFilters(f); setPage(1); };
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); };

  return (
    <>
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">Government Jobs 2025–26</h1>
          <p className="text-sm text-gray-500">
            {filteredJobs.length.toLocaleString("en-IN")} jobs found · Updated 3 hours ago
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-5 flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search by title, department, exam..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-sm shrink-0"
            >
              Search
            </button>
            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6 items-start">

          {/* Sidebar — desktop */}
          <div className="hidden md:block">
            <JobsFilterSidebar filters={filters} onChange={handleFilterChange} totalResults={filteredJobs.length} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Active filter pills */}
            <ActiveFilterPills filters={filters} onChange={handleFilterChange} />

            {/* Sort + results bar */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-800">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredJobs.length)}</span> of{" "}
                <span className="font-semibold text-gray-800">{filteredJobs.length}</span> jobs
              </p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 shrink-0">Sort by:</label>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Eligible-only toggle */}
            <div className="flex items-center gap-2 mb-5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">Profile matching active</p>
                <p className="text-xs text-emerald-600">
                  Jobs marked <span className="font-bold">Eligible</span> match your saved qualification & age profile.{" "}
                  <a href="/profile" className="underline underline-offset-2">Update profile →</a>
                </p>
              </div>
              <button
                onClick={() => setSort("eligible")}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Show eligible first
              </button>
            </div>

            {/* Job list */}
            {paginatedJobs.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">No jobs found</h3>
                <p className="text-sm text-gray-400">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedJobs.map((job) => (
                  <JobListCard key={job.id} job={job} />
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 inset-y-0 w-80 bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <JobsFilterSidebar filters={filters} onChange={(f) => { handleFilterChange(f); setMobileFiltersOpen(false); }} totalResults={filteredJobs.length} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
