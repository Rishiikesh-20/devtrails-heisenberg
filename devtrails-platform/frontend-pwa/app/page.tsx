import { Navbar } from "./components/landing/Navbar";
import { HeroSection } from "./components/landing/HeroSection";
import { LiveRiskCard } from "./components/landing/LiveRiskCard";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { StatsCards } from "./components/landing/StatsCards";
import { HowItWorks } from "./components/landing/HowItWorks";
import { CTASection } from "./components/landing/CTASection";
import { Footer } from "./components/landing/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <LiveRiskCard />
        <StatsCards />
        <FeaturesSection />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
