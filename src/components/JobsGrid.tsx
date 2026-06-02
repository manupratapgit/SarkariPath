import Link from "next/link";
import JobCard, { type JobCardData } from "./JobCard";

const SAMPLE_JOBS: JobCardData[] = [
  {
    id: "upsc-cse-2025",
    title: "UPSC Civil Services Examination 2025",
    organization: "Union Public Service Commission",
    category: "Central Government",
    vacancies: 1056,
    eligibility: "Graduate in any discipline. Age: 21–32 years (relaxation applicable).",
    lastDate: "2026-02-28",
    aiSummary:
      "Premier IAS/IPS recruitment. 3-stage exam: Prelims, Mains, Interview. One of India's most sought-after exams with ~10 lakh applicants annually.",
    notificationUrl: "#",
    applyUrl: "#",
    isNew: true,
  },
  {
    id: "ssc-cgl-2025",
    title: "SSC Combined Graduate Level Examination 2025",
    organization: "Staff Selection Commission",
    category: "Central Government",
    vacancies: 17727,
    eligibility: "Bachelor's degree from a recognised university. Age: 18–32 years.",
    lastDate: "2026-03-15",
    aiSummary:
      "Largest central govt recruitment covering posts like Inspector, Auditor, Accountant, Assistant across 40+ ministries. Tier I & II computer-based tests.",
    notificationUrl: "#",
    applyUrl: "#",
    isNew: true,
  },
  {
    id: "rrb-ntpc-2025",
    title: "RRB NTPC Graduate Posts 2025",
    organization: "Railway Recruitment Board",
    category: "Railways",
    vacancies: 11558,
    eligibility: "Graduate for level 5 & 6 posts; 12th pass for level 2 & 3 posts. Age: 18–33 years.",
    lastDate: "2026-04-10",
    aiSummary:
      "Non-Technical Popular Categories covering Station Master, Goods Guard, Junior Account Assistant. CBT 1 → CBT 2 → Skill/Typing test pattern.",
    notificationUrl: "#",
    applyUrl: "#",
  },
  {
    id: "ibps-po-2025",
    title: "IBPS PO (Probationary Officer) 2025",
    organization: "Institute of Banking Personnel Selection",
    category: "Banking",
    vacancies: 4455,
    eligibility: "Graduation in any stream. Age: 20–30 years. Basic computer proficiency required.",
    lastDate: "2026-02-10",
    aiSummary:
      "PO recruitment across 11 public sector banks. Three-stage process: Prelims, Mains, and Interview. Starting CTC ₹8.2 LPA + allowances.",
    notificationUrl: "#",
    applyUrl: "#",
  },
  {
    id: "agniveer-army-2025",
    title: "Indian Army Agniveer Recruitment 2025",
    organization: "Indian Army",
    category: "Defence",
    vacancies: 25000,
    eligibility: "10th/12th pass depending on category. Age: 17.5–23 years. Physical fitness mandatory.",
    lastDate: "2026-05-01",
    aiSummary:
      "4-year short-service recruitment across multiple trades. 25% retained as permanent soldiers after tour. Includes ₹11.71 lakh Seva Nidhi on exit.",
    notificationUrl: "#",
    applyUrl: "#",
  },
  {
    id: "dsssb-tgt-2025",
    title: "DSSSB TGT / PGT Teacher Recruitment 2025",
    organization: "Delhi Subordinate Services Selection Board",
    category: "Teaching",
    vacancies: 6593,
    eligibility: "B.Ed + relevant subject graduation/post-graduation. CTET/TET qualification mandatory.",
    lastDate: "2026-03-30",
    aiSummary:
      "Teaching posts across Delhi government schools for TGT (classes 6–10) and PGT (11–12). One-tier online exam followed by document verification.",
    notificationUrl: "#",
    applyUrl: "#",
    isNew: true,
  },
];

export default function JobsGrid() {
  return (
    <section className="bg-gray-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Latest Openings</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Trending Government Jobs
            </h2>
            <p className="text-gray-500 text-sm mt-1">AI summaries sourced directly from official notifications</p>
          </div>
          <Link
            href="/jobs"
            className="shrink-0 text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1"
          >
            View all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SAMPLE_JOBS.map((job) => (
            <JobCard key={job.id} {...job} />
          ))}
        </div>
      </div>
    </section>
  );
}
