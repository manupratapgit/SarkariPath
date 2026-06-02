"use client";

import { useState } from "react";

const CATEGORIES = ["Central Government", "State Government", "PSU", "Banking", "Railways", "Defence", "Teaching"];
const EDUCATION = ["10th Pass", "12th Pass", "Graduate", "Post Graduate", "Diploma"];
const STATES = ["All India", "Uttar Pradesh", "Rajasthan", "Bihar", "Madhya Pradesh", "Maharashtra", "Delhi"];

interface Filters {
  categories: string[];
  education: string[];
  state: string;
  lastDateWithin: string;
}

interface FilterSidebarProps {
  onFilterChange?: (filters: Filters) => void;
}

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    education: [],
    state: "All India",
    lastDateWithin: "",
  });

  const toggleArrayFilter = (key: "categories" | "education", value: string) => {
    const updated = filters[key].includes(value)
      ? filters[key].filter((v) => v !== value)
      : [...filters[key], value];
    const newFilters = { ...filters, [key]: updated };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const resetFilters = () => {
    const reset: Filters = { categories: [], education: [], state: "All India", lastDateWithin: "" };
    setFilters(reset);
    onFilterChange?.(reset);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        <button onClick={resetFilters} className="text-xs text-orange-500 hover:underline">
          Reset all
        </button>
      </div>

      <FilterGroup title="Category">
        {CATEGORIES.map((cat) => (
          <CheckboxItem
            key={cat}
            label={cat}
            checked={filters.categories.includes(cat)}
            onChange={() => toggleArrayFilter("categories", cat)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Education">
        {EDUCATION.map((edu) => (
          <CheckboxItem
            key={edu}
            label={edu}
            checked={filters.education.includes(edu)}
            onChange={() => toggleArrayFilter("education", edu)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="State">
        <select
          value={filters.state}
          onChange={(e) => {
            const newFilters = { ...filters, state: e.target.value };
            setFilters(newFilters);
            onFilterChange?.(newFilters);
          }}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup title="Last Date Within">
        <select
          value={filters.lastDateWithin}
          onChange={(e) => {
            const newFilters = { ...filters, lastDateWithin: e.target.value };
            setFilters(newFilters);
            onFilterChange?.(newFilters);
          }}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">Any time</option>
          <option value="7">7 days</option>
          <option value="15">15 days</option>
          <option value="30">30 days</option>
        </select>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CheckboxItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
      />
      <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
    </label>
  );
}
