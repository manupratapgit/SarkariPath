"use client";

import { useState } from "react";

interface TrackedJob {
  id: string;
  title: string;
  organization: string;
  status: "saved" | "applied" | "admit-card" | "result";
  lastDate: string;
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
  const [jobs] = useState<TrackedJob[]>([]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Tracker</h1>
        <p className="text-gray-500 mb-8">Track your application status across all jobs.</p>

        {jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No jobs tracked yet.</p>
            <p className="text-sm mt-1">Browse jobs and save them here to track your progress.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{job.title}</h2>
                  <p className="text-sm text-gray-500">{job.organization}</p>
                  <p className="text-xs text-gray-400 mt-1">Last date: {job.lastDate}</p>
                  {job.notes && <p className="text-sm text-gray-600 mt-2">{job.notes}</p>}
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[job.status]}`}>
                  {STATUS_LABELS[job.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
