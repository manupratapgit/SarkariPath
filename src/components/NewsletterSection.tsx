"use client";

import { useState } from "react";

const PREFERENCES = [
  { value: "UPSC", label: "UPSC" },
  { value: "SSC", label: "SSC" },
  { value: "Banking (IBPS/SBI)", label: "Banking" },
  { value: "Railways (RRB)", label: "Railways" },
  { value: "State PSC", label: "State PSC" },
  { value: "Teaching (DSSSB/KVS)", label: "Teaching" },
];

export default function NewsletterSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const togglePref = (val: string) =>
    setPrefs((p) => p.includes(val) ? p.filter((v) => v !== val) : [...p, val]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, preferences: prefs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong");
        setStatus("error");
        return;
      }
      if (data.status === "already_subscribed") {
        setStatus("already");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section className="bg-gradient-to-br from-orange-500 to-orange-600 py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Free Weekly Digest
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
          Get daily govt job alerts<br className="hidden sm:block" /> in your inbox
        </h2>
        <p className="text-orange-100 text-sm mb-8 max-w-lg mx-auto">
          New job notifications delivered every week. Never miss a deadline — UPSC, SSC, Banking, Railways and more.
        </p>

        {status === "success" && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">You're subscribed!</h3>
            <p className="text-gray-500 text-sm">Check your inbox for a confirmation email. We'll send your first digest next week.</p>
          </div>
        )}

        {status === "already" && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Already subscribed</h3>
            <p className="text-gray-500 text-sm">This email is already signed up. Check your inbox for our weekly digests!</p>
          </div>
        )}

        {(status === "idle" || status === "loading" || status === "error") && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 text-left">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ravi Kumar"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ravi@example.com"
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-600 mb-2.5">I&apos;m interested in (optional)</label>
              <div className="flex flex-wrap gap-2">
                {PREFERENCES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePref(p.value)}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
                      prefs.includes(p.value)
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {status === "error" && errorMsg && (
              <p className="text-sm text-red-600 mb-3">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe — it's free"}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">No spam. Unsubscribe anytime.</p>
          </form>
        )}
      </div>
    </section>
  );
}
