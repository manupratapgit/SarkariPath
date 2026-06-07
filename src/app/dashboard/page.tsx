"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase-browser";
import { useUser } from "@/hooks/useUser";

interface Job { id: string; title: string; organization: string; exam_type: string; last_date: string | null; status: string; vacancies: number | null; vacancies_display: string | null; }
interface TrackedJob { id: string; job_id: string; title: string; organization: string; status: string; last_date: string | null; }
interface Profile { full_name: string | null; preferred_exams: string[] | null; state: string | null; }

const STATUS_COLORS: Record<string, string> = {
  saved: "bg-gray-100 text-gray-700",
  applied: "bg-blue-100 text-blue-700",
  "admit-card": "bg-yellow-100 text-yellow-700",
  result: "bg-green-100 text-green-700",
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl p-5 ${color}`}>
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<Job[]>([]);
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
  const [deadlines, setDeadlines] = useState<Job[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      // Profile
      supabase.from("profiles").select("full_name, preferred_exams, state").eq("id", user.id).single(),
      // Tracked jobs
      supabase.from("tracked_jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]).then(async ([profileRes, trackedRes]) => {
      const prof = profileRes.data as Profile | null;
      setProfile(prof);
      setTrackedJobs((trackedRes.data ?? []) as TrackedJob[]);

      // Matched jobs based on preferred exams
      const exams = prof?.preferred_exams ?? [];
      if (exams.length > 0) {
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, title, organization, exam_type, last_date, status, vacancies, vacancies_display")
          .in("exam_type", exams)
          .eq("status", "Open")
          .order("created_at", { ascending: false })
          .limit(6);
        setMatchedJobs((jobs ?? []) as Job[]);
      } else {
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, title, organization, exam_type, last_date, status, vacancies, vacancies_display")
          .eq("status", "Open")
          .order("created_at", { ascending: false })
          .limit(6);
        setMatchedJobs((jobs ?? []) as Job[]);
      }

      // Upcoming deadlines (next 30 days)
      const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: deadlineJobs } = await supabase
        .from("jobs")
        .select("id, title, organization, exam_type, last_date, status, vacancies, vacancies_display")
        .lte("last_date", soon)
        .gte("last_date", new Date().toISOString())
        .order("last_date", { ascending: true })
        .limit(5);
      setDeadlines((deadlineJobs ?? []) as Job[]);
      setFetching(false);
    });
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const stats = {
    saved: trackedJobs.filter(j => j.status === "saved").length,
    applied: trackedJobs.filter(j => j.status === "applied").length,
    total: trackedJobs.length,
    deadlines: deadlines.length,
  };

  const profileIncomplete = !profile?.full_name || !profile?.preferred_exams?.length;

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s your personalised job dashboard.</p>
        </div>

        {/* Profile incomplete banner */}
        {profileIncomplete && (
          <div className="mb-6 flex items-center justify-between gap-4 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4">
            <div>
              <p className="font-semibold text-orange-800 text-sm">Complete your profile</p>
              <p className="text-orange-600 text-xs mt-0.5">Add your exam preferences to get personalised job matches.</p>
            </div>
            <Link href="/profile" className="shrink-0 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">
              Complete →
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Jobs Saved" value={stats.saved} color="bg-gray-50 text-gray-800" />
          <StatCard label="Applied" value={stats.applied} color="bg-blue-50 text-blue-800" />
          <StatCard label="Total Tracked" value={stats.total} color="bg-purple-50 text-purple-800" />
          <StatCard label="Deadlines Soon" value={stats.deadlines} color="bg-red-50 text-red-800" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matched jobs */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {profile?.preferred_exams?.length ? "Jobs for You" : "Latest Jobs"}
              </h2>
              <Link href="/jobs" className="text-sm text-orange-500 hover:underline">View all →</Link>
            </div>
            {matchedJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
                <p>No open jobs found. <Link href="/jobs" className="text-orange-500 hover:underline">Browse all jobs</Link></p>
              </div>
            ) : (
              <div className="space-y-3">
                {matchedJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}
                    className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-orange-200 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{job.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{job.organization}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs bg-orange-50 text-orange-600 font-medium px-2 py-0.5 rounded-full">{job.exam_type}</span>
                          {job.last_date && (
                            <span className="text-xs text-gray-400">
                              Deadline: {new Date(job.last_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-extrabold text-orange-500">
                          {job.vacancies_display ?? (job.vacancies ? job.vacancies.toLocaleString("en-IN") : "—")}
                        </p>
                        <p className="text-xs text-gray-400">vacancies</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Upcoming deadlines */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Deadlines</h2>
              {deadlines.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center text-gray-400 text-sm">
                  No deadlines in the next 30 days.
                </div>
              ) : (
                <div className="space-y-2">
                  {deadlines.map((job) => {
                    const daysLeft = job.last_date
                      ? Math.ceil((new Date(job.last_date).getTime() - Date.now()) / 86400000)
                      : null;
                    return (
                      <Link key={job.id} href={`/jobs/${job.id}`}
                        className="block bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-red-200 transition-colors">
                        <p className="text-sm font-medium text-gray-800 truncate">{job.title}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-400">{job.organization}</p>
                          {daysLeft !== null && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${daysLeft <= 7 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>
                              {daysLeft}d left
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Saved jobs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Recent Tracked</h2>
                <Link href="/tracker" className="text-sm text-orange-500 hover:underline">View all →</Link>
              </div>
              {trackedJobs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center text-gray-400 text-sm">
                  No tracked jobs yet. <Link href="/jobs" className="text-orange-500 hover:underline">Browse jobs →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {trackedJobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.job_id}`}
                      className="block bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-orange-200 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate flex-1">{job.title}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[job.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{job.organization}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
