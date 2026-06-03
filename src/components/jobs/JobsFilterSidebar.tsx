"use client";

import { useState } from "react";

export interface JobFilters {
  examType: string[];
  qualification: string[];
  ageMin: number;
  ageMax: number;
  location: string[];
  status: string[];
  category: string[];
}

const EXAM_TYPES = ["UPSC", "SSC", "Railways (RRB)", "Banking (IBPS/SBI)", "Defence", "State PSC", "Teaching (DSSSB/KVS)", "Police"];
const QUALIFICATIONS = ["10th Pass", "12th Pass", "ITI / Diploma", "Graduate", "Post Graduate", "B.Tech / BE", "MBBS / Medical", "Law (LLB)"];
const LOCATIONS = ["All India", "Uttar Pradesh", "Rajasthan", "Bihar", "Madhya Pradesh", "Maharashtra", "Gujarat", "West Bengal", "Tamil Nadu", "Karnataka", "Delhi", "Punjab", "Haryana"];
const STATUSES = ["Open", "Closing Soon", "Result Out", "Admit Card Out"];
const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS", "Ex-Servicemen", "PwD"];

export const DEFAULT_FILTERS: JobFilters = {
  examType: [],
  qualification: [],
  ageMin: 18,
  ageMax: 40,
  location: [],
  status: [],
  category: [],
};

interface Props {
  filters: JobFilters;
  onChange: (f: JobFilters) => void;
  totalResults: number;
  counts?: { examType: Record<string, number>; status: Record<string, number> };
}

export default function JobsFilterSidebar({ filters, onChange, totalResults, counts }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setCollapsed((p) => ({ ...p, [key]: !p[key] }));

  const toggleArr = <K extends "examType" | "qualification" | "location" | "status" | "category">(
    key: K,
    val: string
  ) => {
    const cur = filters[key] as string[];
    onChange({ ...filters, [key]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val] });
  };

  const activeCount =
    filters.examType.length + filters.qualification.length + filters.location.length +
    filters.status.length + filters.category.length +
    (filters.ageMin !== 18 || filters.ageMax !== 40 ? 1 : 0);

  return (
    <aside className="w-72 shrink-0">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-20">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Filters</h2>
            <p className="text-xs text-gray-400 mt-0.5">{totalResults.toLocaleString("en-IN")} jobs found</p>
          </div>
          {activeCount > 0 && (
            <button
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="text-xs font-semibold text-orange-500 hover:text-orange-600"
            >
              Clear all ({activeCount})
            </button>
          )}
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto divide-y divide-gray-100">
          {/* Exam Type */}
          <FilterGroup
            label="Exam Type"
            count={filters.examType.length}
            collapsed={collapsed["examType"]}
            onToggle={() => toggle("examType")}
          >
            {EXAM_TYPES.map((v) => (
              <CheckItem key={v} label={v} count={counts?.examType[v]} checked={filters.examType.includes(v)} onChange={() => toggleArr("examType", v)} />
            ))}
          </FilterGroup>

          {/* Qualification */}
          <FilterGroup
            label="Qualification"
            count={filters.qualification.length}
            collapsed={collapsed["qualification"]}
            onToggle={() => toggle("qualification")}
          >
            {QUALIFICATIONS.map((v) => (
              <CheckItem key={v} label={v} checked={filters.qualification.includes(v)} onChange={() => toggleArr("qualification", v)} />
            ))}
          </FilterGroup>

          {/* Age limit */}
          <FilterGroup
            label="Age Limit"
            count={filters.ageMin !== 18 || filters.ageMax !== 40 ? 1 : 0}
            collapsed={collapsed["age"]}
            onToggle={() => toggle("age")}
          >
            <div className="pt-1 pb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-3">
                <span>{filters.ageMin} yrs</span>
                <span>{filters.ageMax} yrs</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Min age</label>
                  <input
                    type="range" min={18} max={40} step={1}
                    value={filters.ageMin}
                    onChange={(e) => onChange({ ...filters, ageMin: Math.min(Number(e.target.value), filters.ageMax - 1) })}
                    className="w-full accent-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Max age</label>
                  <input
                    type="range" min={18} max={45} step={1}
                    value={filters.ageMax}
                    onChange={(e) => onChange({ ...filters, ageMax: Math.max(Number(e.target.value), filters.ageMin + 1) })}
                    className="w-full accent-orange-500"
                  />
                </div>
              </div>
              <p className="text-xs text-center text-orange-500 font-medium mt-2">
                {filters.ageMin}–{filters.ageMax} years
              </p>
            </div>
          </FilterGroup>

          {/* Location */}
          <FilterGroup
            label="Location"
            count={filters.location.length}
            collapsed={collapsed["location"]}
            onToggle={() => toggle("location")}
          >
            {LOCATIONS.map((v) => (
              <CheckItem key={v} label={v} checked={filters.location.includes(v)} onChange={() => toggleArr("location", v)} />
            ))}
          </FilterGroup>

          {/* Status */}
          <FilterGroup
            label="Status"
            count={filters.status.length}
            collapsed={collapsed["status"]}
            onToggle={() => toggle("status")}
          >
            {STATUSES.map((v) => (
              <CheckItem key={v} label={v} count={counts?.status[v]} checked={filters.status.includes(v)} onChange={() => toggleArr("status", v)} />
            ))}
          </FilterGroup>

          {/* Category */}
          <FilterGroup
            label="Category"
            count={filters.category.length}
            collapsed={collapsed["category"]}
            onToggle={() => toggle("category")}
          >
            {CATEGORIES.map((v) => (
              <CheckItem key={v} label={v} checked={filters.category.includes(v)} onChange={() => toggleArr("category", v)} />
            ))}
          </FilterGroup>
        </div>
      </div>
    </aside>
  );
}

function FilterGroup({
  label, count, collapsed, onToggle, children,
}: {
  label: string; count: number; collapsed?: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 uppercase tracking-wide flex items-center gap-2">
          {label}
          {count > 0 && (
            <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {!collapsed && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}

function CheckItem({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        onClick={onChange}
        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-orange-500 border-orange-500" : "border-gray-300 group-hover:border-orange-400"
        }`}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm text-gray-600 group-hover:text-gray-900 flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[11px] text-gray-400 font-medium">{count}</span>
      )}
    </label>
  );
}
