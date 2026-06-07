import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "Terms of Use — SarkariPath" };

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Terms of Use</h1>
        <p className="text-gray-500 text-sm">Last updated: June 2025</p>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Use of Information</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            All job listings on SarkariPath are sourced from official government websites. While we
            strive for accuracy, always verify details on the official notification before applying.
            SarkariPath is not responsible for errors in the source data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">No Fees</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            SarkariPath is a free service. We do not charge candidates for accessing job listings or
            receiving email alerts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Content</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Job notification content is reproduced from public government documents for informational
            purposes only. All rights to original content belong to the respective government bodies.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
