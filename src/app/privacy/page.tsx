import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "Privacy Policy — SarkariPath" };

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">Last updated: June 2025</p>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">What we collect</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            We collect your email address and name when you subscribe to our newsletter. We do not sell
            or share your data with third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">How we use it</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your email is used solely to send you the weekly government job digest and important
            notifications you opted into. You can unsubscribe at any time by replying &quot;unsubscribe&quot;
            to any email.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Cookies & Analytics</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            We use Vercel Analytics to understand page traffic anonymously. No personal data is
            stored in cookies.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
