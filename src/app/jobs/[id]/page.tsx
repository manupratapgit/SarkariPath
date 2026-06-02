import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface JobDetails {
  qualification?: string | null;
  age_limit?: string | null;
  application_deadline?: string | null;
  location?: string | null;
  notes?: string | null;
  vacancies?: number | null;
  source?: string | null;
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
  "Closing Soon": "bg-red-100 text-red-600 animate-pulse",
  "Result Out": "bg-blue-100 text-blue-700",
  "Admit Card Out": "bg-yellow-100 text-yellow-700",
};

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);
  if (!job) notFound();

  let details: JobDetails = {};
  try {
    details = job.details ? JSON.parse(job.details) : {};
  } catch {
    details = {};
  }

  const lastDate = job.last_date || details.application_deadline;
  const daysLeft = lastDate
    ? Math.ceil((new Date(lastDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  const notifUrl = job.notification_url && job.notification_url !== "#"
    ? job.notification_url
    : "https://www.employmentnews.gov.in";

  const applyUrl = job.apply_url && job.apply_url !== "#"
    ? job.apply_url
    : `https://www.google.com/search?q=${encodeURIComponent((job.title ?? "") + " " + (job.organization ?? "") + " apply online official")}`;

  const deadline = details.application_deadline || job.last_date;
  const ageLimit = job.age_limit || details.age_limit;
  const notes = details.notes || job.ai_summary;
  const qualification = job.eligibility || details.qualification;

  return (
    <>
      <Navbar />

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

          {/* Back */}
          <a
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </a>

          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full">
                {job.exam_type}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLE[job.status] ?? "bg-gray-100 text-gray-600"}`}>
                {job.status}
              </span>
              {job.source && (
                <span className="text-xs text-gray-400 border border-gray-200 px-2.5 py-0.5 rounded-full">
                  {job.source}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug mb-2">
              {job.title}
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-6">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
              </svg>
              {job.organization}
            </p>

            {/* Key stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox
                label="Vacancies"
                value={job.vacancies ? job.vacancies.toLocaleString("en-IN") : "—"}
                icon="👥"
              />
              <StatBox label="Location" value={job.location || "—"} icon="📍" />
              <StatBox label="Age Limit" value={ageLimit || "—"} icon="🎂" />
              <StatBox
                label="Deadline"
                value={
                  isExpired
                    ? "Passed"
                    : daysLeft !== null
                    ? `${daysLeft} days left`
                    : "—"
                }
                icon="📅"
                highlight={isUrgent}
                dimmed={isExpired}
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
              Recruitment Details
            </h2>
            <div className="space-y-5">
              <DetailRow label="Eligibility / Qualification" value={qualification} />
              <DetailRow label="Age Limit" value={ageLimit} />
              <DetailRow label="Number of Vacancies" value={job.vacancies ? String(job.vacancies) : undefined} />
              <DetailRow label="Application Deadline" value={deadline} />
              <DetailRow label="Location / Posting" value={job.location} />
              <DetailRow label="Category" value={job.category !== "General" ? job.category : undefined} />
            </div>
          </div>

          {/* Press release / notes */}
          {notes && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
              <h2 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
                Detailed Press Release / Notes
              </h2>
              <p className="text-sm text-gray-700 leading-loose whitespace-pre-line">{notes}</p>
            </div>
          )}

          {/* Deadline warning */}
          {isUrgent && !isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-semibold text-red-700">
                Only {daysLeft} day{daysLeft === 1 ? "" : "s"} left to apply! Deadline: {deadline}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={notifUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Official Notification / Recruitment Page
            </a>
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
            >
              Apply Now →
            </a>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            SarkariPath sources data from Employment News. Always verify details on the official website before applying.
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}

function StatBox({
  label, value, icon, highlight, dimmed,
}: {
  label: string; value: string; icon: string; highlight?: boolean; dimmed?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3.5">
      <p className="text-lg mb-1">{icon}</p>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-bold leading-snug ${highlight ? "text-red-600" : dimmed ? "text-gray-400" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:w-48 shrink-0 mb-1 sm:mb-0 sm:pt-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-800 leading-relaxed flex-1">{value}</p>
    </div>
  );
}
