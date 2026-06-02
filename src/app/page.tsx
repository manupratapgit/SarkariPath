import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsRow from "@/components/StatsRow";
import JobsGrid from "@/components/JobsGrid";
import AlertBanner from "@/components/AlertBanner";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsRow />
        <JobsGrid />
        <AlertBanner />
        <FeaturesSection />
      </main>
      <Footer />
    </>
  );
}
