import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "Contact — SarkariPath" };

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-gray-600 text-base leading-relaxed mb-6">
          Have a question, suggestion, or found an issue with a job listing? We&apos;d love to hear from you.
        </p>
        <p className="text-gray-700 font-medium">
          Email:{" "}
          <a href="mailto:support@sarkaripath.in" className="text-orange-500 hover:underline">
            support@sarkaripath.in
          </a>
        </p>
      </main>
      <Footer />
    </>
  );
}
