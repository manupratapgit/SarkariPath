"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

export interface JobListItem {
  id: string;
  title: string;
  organization: string;
  category: string;
  examType: string;
  vacancies: number;
  vacanciesDisplay?: string;
  eligibility: string;
  lastDate: string;
  aiSummary: string;
  location: string;
  status: "Open" | "Closing Soon" | "Result Out" | "Admit Card Out";
  notificationUrl: string;
  applyUrl: string;
  isEligible?: boolean;
}

const STATUS_STYLE: Record<JobListItem["status"], string> = {
  "Open": "bg-green-100 text-green-700",
  "Closing Soon": "bg-red-100 text-red-600",
  "Result Out": "bg-blue-100 text-blue-700",
  "Admit Card Out": "bg-yellow-100 text-yellow-700",
};

export default function JobListCard({ job }: { job: JobListItem }) {
  const supabase = createClient();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trackId, setTrackId] = useState<string | null>(null);

  // Check if already saved on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("tracked_jobs")
        .select("id")
        .eq("user_id", user.id)
        .eq("job_id", job.id)
        .single()
        .then(({ data }) => {
          if (data) { setSaved(true); setTrackId(data.id); }
        });
    });
  }, [job.id]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (saved && trackId) {
      await supabase.from("tracked_jobs").delete().eq("id", trackId);
      setSaved(false);
      setTrackId(null);
    } else {
      const { data } = await supabase.from("tracked_jobs").insert({
        user_id: user.id,
        job_id: job.id,
        title: job.title,
        organization: job.organization,
        status: "saved",
        last_date: job.lastDate || null,
        notes: "",
      }).select("id").single();
      if (data) { setSaved(true); setTrackId(data.id); }
    }
    setSaving(false);
  };

  const daysLeft = Math.ceil(
    (new Date(job.lastDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = daysLeft < 0;

  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {job.examType}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[job.status]}`}>
                {job.status}
              </span>
              {job.isEligible && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Eligible
                </span>
              )}
            </div>
            <Link href={`/jobs/${job.id}`} className="group">
              <h2 className="text-base font-bold text-gray-900 leading-snug group-hover:text-orange-600 transition-colors">
                {job.title}
              </h2>
            </Link>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {job.organization}
              <span className="mx-1 text-gray-300">·</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {job.location}
            </p>
          </div>
          <div className="text-right shrink-0">
            {job.vacanciesDisplay === "See notification" ? (
              <>
                <p className="text-xs font-semibold text-orange-500 leading-none">See</p>
                <p className="text-xs font-semibold text-orange-500">notification</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-gray-900 leading-none">
                  {(job.vacanciesDisplay || job.vacancies?.toLocaleString("en-IN") || "—")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">vacancies</p>
              </>
            )}
          </div>
        </div>

        {/* AI Summary */}
        <div className="flex items-start gap-2 bg-indigo-50 rounded-xl px-3 py-2.5 mb-3">
          <svg className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C7.58 3 4 6.58 4 11c0 2.42 1.08 4.58 2.78 6.08L6 21l4.08-1.08C11 20.3 11.5 20 12 20c4.42 0 8-3.58 8-8s-3.58-9-8-9zm1 13h-2v-2h2v2zm0-4h-2V7h2v5z"/>
          </svg>
          <p className="text-xs text-indigo-700 leading-relaxed">{job.aiSummary}</p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422A12.083 12.083 0 0112 20.055a12.083 12.083 0 01-6.16-2.477L12 14z" />
            </svg>
            {job.eligibility}
          </span>
          <span className={`flex items-center gap-1 font-medium ${isExpired ? "text-gray-400" : daysLeft <= 7 ? "text-red-600" : "text-gray-600"}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isExpired
              ? "Deadline passed"
              : `Last date: ${new Date(job.lastDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${daysLeft}d left`}
          </span>
        </div>
      </div>

      {/* Action footer */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
            saved
              ? "bg-yellow-50 border-yellow-200 text-yellow-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {saving ? "…" : saved ? "Saved" : "Save"}
        </button>

        <div className="flex-1" />

        <a
          href={job.notificationUrl && job.notificationUrl !== "#" ? job.notificationUrl : "https://www.employmentnews.gov.in"}
          target="_blank" rel="noopener noreferrer"
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Notification
        </a>
        <a
          href={`/jobs/${job.id}`}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Details
        </a>
        <a
          href={job.applyUrl && job.applyUrl !== "#" ? job.applyUrl : `https://www.google.com/search?q=${encodeURIComponent(job.title + " " + job.organization + " apply online")}`}
          target="_blank" rel="noopener noreferrer"
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm"
        >
          Apply Now →
        </a>
      </div>
    </article>
  );
}
