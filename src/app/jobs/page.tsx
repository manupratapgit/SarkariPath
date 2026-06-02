import JobCard from "@/components/JobCard";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sarkari Jobs</h1>
        <SearchBar />
        <div className="flex gap-6 mt-6">
          <aside className="w-64 shrink-0">
            <FilterSidebar />
          </aside>
          <main className="flex-1 grid gap-4">
            {/* Job cards will be populated here */}
            <JobCard
              title="UPSC Civil Services 2025"
              organization="Union Public Service Commission"
              lastDate="2025-03-15"
              category="Central Government"
              vacancies={1000}
              notificationUrl="#"
              applyUrl="#"
            />
          </main>
        </div>
      </div>
    </div>
  );
}
