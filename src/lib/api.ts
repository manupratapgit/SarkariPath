export interface Job {
  id: string;
  title: string;
  organization: string;
  category: string;
  vacancies: number;
  lastDate: string;
  notificationUrl: string;
  applyUrl: string;
  educationRequired: string[];
  state: string;
  postedAt: string;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
}

export interface JobFilters {
  query?: string;
  categories?: string[];
  education?: string[];
  state?: string;
  lastDateWithin?: number; // days
  page?: number;
  pageSize?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export async function fetchJobs(filters: JobFilters = {}): Promise<JobsResponse> {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.categories?.length) params.set("categories", filters.categories.join(","));
  if (filters.education?.length) params.set("education", filters.education.join(","));
  if (filters.state) params.set("state", filters.state);
  if (filters.lastDateWithin) params.set("lastDateWithin", String(filters.lastDateWithin));
  params.set("page", String(filters.page ?? 1));
  params.set("pageSize", String(filters.pageSize ?? 20));

  const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
  return res.json();
}
