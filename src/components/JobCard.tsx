interface JobCardProps {
  title: string;
  organization: string;
  lastDate: string;
  category: string;
  vacancies: number;
  notificationUrl: string;
  applyUrl: string;
}

export default function JobCard({
  title,
  organization,
  lastDate,
  category,
  vacancies,
  notificationUrl,
  applyUrl,
}: JobCardProps) {
  const isExpiringSoon = () => {
    const diff = new Date(lastDate).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <span className="inline-block text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded mb-2">
            {category}
          </span>
          <h2 className="text-lg font-semibold text-gray-900 leading-snug">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{organization}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400">Vacancies</p>
          <p className="text-xl font-bold text-gray-800">{vacancies.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className={`text-sm font-medium ${isExpiringSoon() ? "text-red-600" : "text-gray-600"}`}>
          Last Date: {new Date(lastDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          {isExpiringSoon() && <span className="ml-1 text-red-500">⚠ Expiring soon</span>}
        </p>
        <div className="flex gap-2">
          <a
            href={notificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Notification
          </a>
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          >
            Apply Now
          </a>
        </div>
      </div>
    </div>
  );
}
