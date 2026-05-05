import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import SuccessStories from "@/components/SuccessStories";
import MeetTheTeam from "@/components/MeetTheTeam";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import TrustBar from "@/components/TrustBar";
import { JobsPreview, ServicesPreview } from "@/components/HomeFunnel";
import { useSEO } from "@/lib/seo";

const Index = () => {
  useSEO({
    title: "Steve Safari Agency - Verified Jobs Abroad for Kenyans",
    description:
      "Verified recruitment + document services for Kenyans applying to Canada and beyond. Transparent fees, real receipts, M-Pesa payments.",
    canonical: "https://work-leap-kenya.lovable.app/",
  });
  return (
    <div className="min-h-screen">
      <TrustBar />
      <Navbar />
      <main className="pt-16">
        {/* Funnel: Hero → How It Works → Trust (stories + team) → Jobs preview → Services preview → Final CTA */}
        <HeroSection />
        <HowItWorks />
        <SuccessStories />
        <MeetTheTeam />
        <JobsPreview />
        <ServicesPreview />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
