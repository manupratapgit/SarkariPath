"use client";

import { useState } from "react";

export default function AlertBanner() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: "", preferences: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      if (data.status === "already_subscribed") {
        setMessage("You're already subscribed!");
      } else {
        setMessage("You're on the list! Check your inbox.");
      }
      setStatus("success");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to subscribe. Try again.");
      setStatus("error");
    }
  };

  return (
    <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-14 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-5">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
          </svg>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
          Never Miss a Notification
        </h2>
        <p className="text-orange-100 text-base mb-8 max-w-xl mx-auto">
          Get instant alerts for new job notifications, admit card releases, result announcements,
          and application deadlines — directly to your inbox.
        </p>

        {status === "success" ? (
          <div className="inline-flex items-center gap-2 bg-white text-orange-600 font-semibold px-6 py-3 rounded-xl shadow">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {message}
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-60"
              >
                {status === "loading" ? "Subscribing…" : "Get Alerts Free"}
              </button>
            </form>
            {status === "error" && (
              <p className="text-white/80 text-sm mt-3">{message}</p>
            )}
          </>
        )}

        <p className="text-orange-200 text-xs mt-4">
          No spam. Unsubscribe anytime. Join 8.5 lakh+ aspirants.
        </p>
      </div>
    </section>
  );
}
