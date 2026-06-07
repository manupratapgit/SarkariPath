import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "About — SarkariPath" };

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">About SarkariPath</h1>
        <p className="text-gray-600 text-base leading-relaxed mb-4">
          SarkariPath is India&apos;s AI-powered government job portal. We aggregate official notifications
          from UPSC, SSC, Railways, Banking and other sources so you never miss an opportunity.
        </p>
        <p className="text-gray-600 text-base leading-relaxed">
          Our scrapers pull data weekly from official government websites, and Claude AI extracts
          structured details (vacancies, eligibility, deadlines) from dense PDFs — saving you hours of reading.
        </p>
      </main>
      <Footer />
    </>
  );
}
