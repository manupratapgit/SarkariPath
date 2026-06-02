"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATES = [
  "All States", "Uttar Pradesh", "Rajasthan", "Bihar", "Madhya Pradesh",
  "Maharashtra", "Gujarat", "West Bengal", "Tamil Nadu", "Karnataka",
  "Andhra Pradesh", "Punjab", "Haryana", "Jharkhand", "Uttarakhand", "Delhi",
];

const QUICK_TAGS = [
  "UPSC CSE", "SSC CGL", "Railway NTPC", "Bank PO", "Defence",
  "Teaching", "Police", "State PSC",
];

export default function HeroSection() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("All States");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (state !== "All States") params.set("state", state);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <section className="relative bg-gradient-to-br from-orange-50 via-white to-blue-50 pt-16 pb-20 px-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-100 rounded-full opacity-40 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
          Updated every 6 hours from official sources
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
          Find Your{" "}
          <span className="text-orange-500 relative">
            Sarkari Job
            <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
              <path d="M0 6 Q75 0 150 4 Q225 8 300 2" stroke="#f97316" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </span>{" "}
          in Seconds
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
          AI-powered summaries of every government job notification — UPSC, SSC, Railways, Banking &amp; more. Never miss a deadline again.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-2"
        >
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs, departments, posts..."
              className="w-full pl-10 pr-3 py-3 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
            />
          </div>
          <div className="w-px bg-gray-200 hidden sm:block self-stretch my-1" />
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="sm:w-44 px-3 py-3 text-sm text-gray-600 bg-transparent focus:outline-none cursor-pointer"
          >
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button
            type="submit"
            className="px-6 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
          >
            Search Jobs
          </button>
        </form>

        {/* Quick tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <span className="text-xs text-gray-400 self-center">Popular:</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => router.push(`/jobs?q=${encodeURIComponent(tag)}`)}
              className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full hover:border-orange-400 hover:text-orange-600 transition-colors shadow-sm"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
