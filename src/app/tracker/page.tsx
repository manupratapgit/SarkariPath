"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase-browser";
import { useUser } from "@/hooks/useUser";

interface TrackedJob {
  id: string;
  job_id: string;
  title: string;
  organization: string;
  status: "saved" | "applied" | "admit-card" | "result";
  last_date: string | null;
  notes: string;
}

const STATUS_LABELS: Record<TrackedJob["status"], string> = {
  saved: "Saved",
  applied: "Applied",
  "admit-card": "Admit Card",
  result: "Result",
};

const STATUS_COLORS: Record<TrackedJob["status"], string> = {
  saved: "bg-gray-100 text-gray-700",
  applied: "bg-blue-100 text-blue-700",
  "admit-card": "bg-yellow-100 text-yellow-700",
  result: "bg-green-100 text-green-700",
};

export default function TrackerPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tracked_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setJobs(data ?? []);
        setFetching(false);
      });
  }, [user]);

  const removeJob = async (id: string) => {
    await supabase.from("tracked_jobs").delete().eq("id", id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const updateStatus = async (id: string, status: TrackedJob["status"]) => {
    await supabase.from("tracked_jobs").update({ status }).eq("id", id);
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status } : j));
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Tracker</h1>
            <p className="text-gray-500 text-sm mt-1">Track your application status across all jobs.</p>
          </div>
          <Link href="/jobs" className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">
            Browse Jobs
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-500">No jobs tracked yet</p>
            <p className="text-sm mt-1">Go to <Link href="/jobs" className="text-orange-500 hover:underline">Jobs</Link> and click Track on any listing.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/jobs/${job.job_id}`} className="font-semibold text-gray-900 hover:text-orange-500 transition-colors">
                      {job.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">{job.organization}</p>
                    {job.last_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        Deadline: {new Date(job.last_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                    {job.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">{job.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <select
                      value={job.status}
                      onChange={(e) => updateStatus(job.id, e.target.value as TrackedJob["status"])}
                      className={`text-xs font-medium px-3 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[job.status]}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <button onClick={() => removeJob(job.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
