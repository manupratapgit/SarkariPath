"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobsFilterSidebar, { DEFAULT_FILTERS, type JobFilters } from "@/components/jobs/JobsFilterSidebar";
import ActiveFilterPills from "@/components/jobs/ActiveFilterPills";
import JobListCard, { type JobListItem } from "@/components/jobs/JobListCard";
import Pagination from "@/components/jobs/Pagination";

const SORT_OPTIONS = [
  { value: "latest", label: "Latest First" },
  { value: "deadline", label: "Deadline (Soonest)" },
  { value: "vacancies", label: "Most Vacancies" },
  { value: "eligible", label: "Eligible Jobs First" },
];

const PAGE_SIZE_OPTIONS = [
  { value: 20, label: "20 per page" },
  { value: 50, label: "50 per page" },
];

function mapRow(r: Record<string, unknown>): JobListItem {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    organization: String(r.organization ?? ""),
    category: String(r.category ?? "General"),
    examType: String(r.exam_type ?? "UPSC"),
    vacancies: Number(r.vacancies ?? 0),
    vacanciesDisplay: r.vacancies_display ? String(r.vacancies_display) : (r.vacancies ? String(r.vacancies) : "See notification"),
    eligibility: String(r.eligibility ?? ""),
    lastDate: String(r.last_date ?? new Date().toISOString().slice(0, 10)),
    aiSummary: String(r.ai_summary ?? ""),
    location: String(r.location ?? "All India"),
    status: (r.status as JobListItem["status"]) ?? "Open",
    notificationUrl: String(r.notification_url ?? "#"),
    applyUrl: String(r.apply_url ?? "#"),
    isEligible: false,
  };
}

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCounts, setFilterCounts] = useState<{ examType: Record<string, number>; status: Record<string, number> }>({ examType: {}, status: {} });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filters.examType.length) params.set("examType", filters.examType[0]);
      if (filters.location.length) params.set("location", filters.location[0]);
      if (filters.status.length) params.set("status", filters.status[0]);
      if (filters.category.length) params.set("category", filters.category[0]);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/jobs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs((data.jobs ?? []).map(mapRow));
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setError("Could not load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query, filters, sort, page, pageSize]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    fetch("/api/jobs/counts").then((r) => r.json()).then(setFilterCounts).catch(() => {});
  }, []);

  const handleFilterChange = (f: JobFilters) => { setFilters(f); setPage(1); };
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); };
  const handlePageSizeChange = (size: number) => { setPageSize(size); setPage(1); };

  const displayJobs = useMemo(() => {
    if (sort !== "eligible") return jobs;
    return [...jobs].sort((a, b) => (b.isEligible ? 1 : 0) - (a.isEligible ? 1 : 0));
  }, [jobs, sort]);

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <>
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">
            Government Jobs in India
          </h1>
          <p className="text-sm text-gray-500">
            {loading ? "Loading…" : `${total.toLocaleString("en-IN")} jobs found · Updated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`}
          </p>

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
            <button type="submit" className="px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-sm shrink-0">
              Search
            </button>
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

          <div className="hidden md:block">
            <JobsFilterSidebar filters={filters} onChange={handleFilterChange} totalResults={total} counts={filterCounts} />
          </div>

          <div className="flex-1 min-w-0">
            <ActiveFilterPills filters={filters} onChange={handleFilterChange} />

            {/* Sort + results bar */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <p className="text-sm text-gray-500">
                {loading ? "Loading…" : (
                  <>
                    Showing <span className="font-semibold text-gray-800">{start}–{end}</span> of{" "}
                    <span className="font-semibold text-gray-800">{total}</span> jobs
                    {totalPages > 1 && (
                      <span className="ml-2 text-gray-400">· Page {page} of {totalPages}</span>
                    )}
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {PAGE_SIZE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <label className="text-xs text-gray-500 shrink-0">Sort:</label>
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

            {/* Eligible toggle */}
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
              <button onClick={() => setSort("eligible")} className="shrink-0 text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                Show eligible first
              </button>
            </div>

            {error && (
              <div className="text-center py-10 bg-red-50 border border-red-100 rounded-2xl mb-4">
                <p className="text-sm text-red-600">{error}</p>
                <button onClick={fetchJobs} className="mt-2 text-xs text-red-500 underline">Retry</button>
              </div>
            )}

            {loading && !error && (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && displayJobs.length === 0 && (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">No jobs found</h3>
                <p className="text-sm text-gray-400">Try adjusting your filters or search query.</p>
              </div>
            )}

            {!loading && !error && displayJobs.length > 0 && (
              <div className="space-y-4">
                {displayJobs.map((job) => (
                  <JobListCard key={job.id} job={job} />
                ))}
              </div>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          </div>
        </div>
      </div>

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
              <JobsFilterSidebar filters={filters} onChange={(f) => { handleFilterChange(f); setMobileFiltersOpen(false); }} totalResults={total} counts={filterCounts} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
