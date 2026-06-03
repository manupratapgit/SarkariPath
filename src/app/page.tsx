export const revalidate = 3600; // revalidate every hour

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsRow from "@/components/StatsRow";
import JobsGrid from "@/components/JobsGrid";
import FeaturesSection from "@/components/FeaturesSection";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsRow />
        <JobsGrid />
        <FeaturesSection />
        <NewsletterSection />
      </main>
      <Footer />
    </>
  );
}
