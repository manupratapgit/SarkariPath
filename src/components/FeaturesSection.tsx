const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: "text-orange-500 bg-orange-50",
    title: "AI-Powered Summaries",
    description:
      "Dense government PDFs summarised in plain English. Understand eligibility, selection process, and key dates at a glance — no legalese.",
    points: ["Eligibility decoded in seconds", "Selection process explained", "Key dates highlighted"],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: "text-blue-500 bg-blue-50",
    title: "100% Official Sources",
    description:
      "Every notification is scraped directly from UPSC, SSC, RRB, IBPS, and state PSC official portals. No third-party rumours or misinformation.",
    points: ["Direct from govt portals", "Source links always provided", "Verified before publishing"],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    color: "text-green-500 bg-green-50",
    title: "Application Tracker",
    description:
      "Track every form you fill — from application to admit card to result. Get deadline reminders so you never miss a step in your preparation journey.",
    points: ["Save & track applications", "Admit card & result alerts", "Preparation timeline view"],
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-2">Why SarkariPath</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Everything You Need to Land Your Dream Job
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base">
            Built for serious aspirants who want accurate info, faster — without wading through dense PDFs or unreliable third-party sites.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-gray-50 hover:bg-white rounded-2xl p-7 border border-transparent hover:border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">{f.description}</p>
              <ul className="space-y-2">
                {f.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
