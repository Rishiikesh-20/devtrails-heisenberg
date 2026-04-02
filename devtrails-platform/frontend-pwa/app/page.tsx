import { Navbar } from "./components/landing/Navbar";
import { HeroSection } from "./components/landing/HeroSection";
import { LiveRiskCard } from "./components/landing/LiveRiskCard";
import { StatsCards } from "./components/landing/StatsCards";
import { HowItWorks } from "./components/landing/HowItWorks";
import { TrustIndicators } from "./components/landing/TrustIndicators";
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
        <HowItWorks />
        <TrustIndicators />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
