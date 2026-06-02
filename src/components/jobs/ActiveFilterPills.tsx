import { type JobFilters, DEFAULT_FILTERS } from "./JobsFilterSidebar";

interface Props {
  filters: JobFilters;
  onChange: (f: JobFilters) => void;
}

type ArrKey = "examType" | "qualification" | "location" | "status" | "category";

export default function ActiveFilterPills({ filters, onChange }: Props) {
  const pills: { label: string; onRemove: () => void }[] = [];

  const arrKeys: { key: ArrKey; prefix: string }[] = [
    { key: "examType", prefix: "" },
    { key: "qualification", prefix: "" },
    { key: "location", prefix: "📍 " },
    { key: "status", prefix: "" },
    { key: "category", prefix: "Cat: " },
  ];

  for (const { key, prefix } of arrKeys) {
    for (const val of filters[key]) {
      pills.push({
        label: `${prefix}${val}`,
        onRemove: () =>
          onChange({ ...filters, [key]: (filters[key] as string[]).filter((v) => v !== val) }),
      });
    }
  }

  if (filters.ageMin !== 18 || filters.ageMax !== 40) {
    pills.push({
      label: `Age: ${filters.ageMin}–${filters.ageMax} yrs`,
      onRemove: () => onChange({ ...filters, ageMin: 18, ageMax: 40 }),
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-xs text-gray-400 font-medium shrink-0">Active filters:</span>
      {pills.map((p) => (
        <span
          key={p.label}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full"
        >
          {p.label}
          <button
            onClick={p.onRemove}
            className="hover:text-orange-900 transition-colors"
            aria-label={`Remove ${p.label}`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <button
        onClick={() => onChange(DEFAULT_FILTERS)}
        className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}
