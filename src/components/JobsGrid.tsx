import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import JobCard, { type JobCardData } from "./JobCard";

async function getLatestJobs(): Promise<JobCardData[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("jobs")
    .select("id, title, organization, category, vacancies, eligibility, last_date, ai_summary, notification_url, apply_url, status")
    .order("created_at", { ascending: false })
    .limit(6);

  return (data ?? []).map((r) => ({
    id: String(r.id),
    title: String(r.title),
    organization: String(r.organization),
    category: String(r.category ?? "General"),
    vacancies: Number(r.vacancies ?? 0),
    eligibility: String(r.eligibility ?? ""),
    lastDate: String(r.last_date ?? new Date().toISOString().slice(0, 10)),
    aiSummary: String(r.ai_summary ?? ""),
    notificationUrl: String(r.notification_url ?? "#"),
    applyUrl: String(r.apply_url ?? "#"),
    isNew: r.status === "Open",
  }));
}

export default async function JobsGrid() {
  const jobs = await getLatestJobs();

  return (
    <section className="bg-gray-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Latest Openings</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Trending Government Jobs
            </h2>
            <p className="text-gray-500 text-sm mt-1">AI summaries sourced directly from official notifications</p>
          </div>
          <Link
            href="/jobs"
            className="shrink-0 text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1"
          >
            View all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <JobCard key={job.id} {...job} />
          ))}
        </div>
      </div>
    </section>
  );
}
