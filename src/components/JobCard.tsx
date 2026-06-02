import Link from "next/link";

export interface JobCardData {
  id: string;
  title: string;
  organization: string;
  category: string;
  vacancies: number;
  eligibility: string;
  lastDate: string;
  aiSummary: string;
  notificationUrl: string;
  applyUrl: string;
  isNew?: boolean;
}

export default function JobCard({
  id,
  title,
  organization,
  category,
  vacancies,
  eligibility,
  lastDate,
  aiSummary,
  notificationUrl,
  applyUrl,
  isNew,
}: JobCardData) {
  const daysLeft = Math.ceil(
    (new Date(lastDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isUrgent = daysLeft >= 0 && daysLeft <= 7;
  const isExpired = daysLeft < 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <div className="p-5 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {category}
              </span>
              {isNew && (
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  New
                </span>
              )}
              {isUrgent && (
                <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">
                  Closing soon
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{organization}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-extrabold text-gray-900">{vacancies.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400">Vacancies</p>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-blue-50 rounded-xl px-3 py-2.5 mb-3">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5 shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
            </span>
            <p className="text-xs text-blue-700 leading-relaxed">{aiSummary}</p>
          </div>
        </div>

        {/* Eligibility */}
        <div className="flex items-start gap-1.5 mb-4">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z" />
          </svg>
          <p className="text-xs text-gray-600">{eligibility}</p>
        </div>

        {/* Deadline */}
        <div className={`flex items-center gap-1.5 text-xs font-medium ${isExpired ? "text-gray-400" : isUrgent ? "text-red-600" : "text-gray-600"}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
          </svg>
          {isExpired
            ? "Deadline passed"
            : `Last date: ${new Date(lastDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${daysLeft} days left`}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
        <a
          href={notificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs font-semibold py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Notification
        </a>
        <Link
          href={`/jobs/${id}`}
          className="flex-1 text-center text-xs font-semibold py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Details
        </Link>
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
          Apply Now
        </a>
      </div>
    </div>
  );
}
