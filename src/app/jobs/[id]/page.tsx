import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface JobDetails {
  qualification: string | null;
  age_limit: string | null;
  application_deadline: string | null;
  location: string | null;
  notes: string | null;
  vacancies: number | null;
  source: string | null;
}

async function getJob(id: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.from("jobs").select("*").eq("id", id).single();
  return data;
}

const STATUS_STYLE: Record<string, string> = {
  "Open": "bg-green-100 text-green-700",
  "Closing Soon": "bg-red-100 text-red-600",
  "Result Out": "bg-blue-100 text-blue-700",
  "Admit Card Out": "bg-yellow-100 text-yellow-700",
};

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);
  if (!job) notFound();

  let details: JobDetails | null = null;
  try {
    details = job.details ? JSON.parse(job.details) : null;
  } catch {
    details = null;
  }

  const daysLeft = job.last_date
    ? Math.ceil((new Date(job.last_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpired = daysLeft !== null && daysLeft < 0;

  return (
    <>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full">
              {job.exam_type}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLE[job.status] ?? "bg-gray-100 text-gray-600"}`}>
              {job.status}
            </span>
            {job.source && (
              <span className="text-xs text-gray-400">Source: {job.source}</span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 leading-snug mb-1">{job.title}</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            {job.organization}
          </p>

          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBox label="Vacancies" value={job.vacancies ? job.vacancies.toLocaleString("en-IN") : "—"} />
            <StatBox label="Location" value={job.location || "—"} />
            <StatBox label="Age Limit" value={job.age_limit || details?.age_limit || "—"} />
            <StatBox
              label="Last Date"
              value={
                isExpired
                  ? "Deadline passed"
                  : daysLeft !== null
                  ? `${daysLeft}d left`
                  : "—"
              }
              highlight={!isExpired && daysLeft !== null && daysLeft <= 7}
            />
          </div>
        </div>

        {/* AI Summary */}
        {job.ai_summary && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6 flex gap-3">
            <svg className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C7.58 3 4 6.58 4 11c0 2.42 1.08 4.58 2.78 6.08L6 21l4.08-1.08C11 20.3 11.5 20 12 20c4.42 0 8-3.58 8-8s-3.58-9-8-9zm1 13h-2v-2h2v2zm0-4h-2V7h2v5z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">AI Summary</p>
              <p className="text-sm text-indigo-800 leading-relaxed">{job.ai_summary}</p>
            </div>
          </div>
        )}

        {/* Full details */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 space-y-5">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Recruitment Details</h2>

          <DetailRow label="Qualification / Eligibility" value={job.eligibility || details?.qualification} />
          <DetailRow label="Age Limit" value={job.age_limit || details?.age_limit} />
          <DetailRow label="Application Deadline" value={details?.application_deadline || job.last_date} />
          <DetailRow label="Location / Posting" value={job.location || details?.location} />
          <DetailRow label="Additional Information" value={details?.notes} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <a
            href={job.notification_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Official Notification
          </a>
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
          >
            Apply Now →
          </a>
        </div>
      </div>

      <Footer />
    </>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-red-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
    </div>
  );
}
