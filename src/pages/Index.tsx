import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedJobs from "@/components/FeaturedJobs";
import ServicesSection from "@/components/ServicesSection";
import HowItWorks from "@/components/HowItWorks";
import SuccessStories from "@/components/SuccessStories";
import MeetTheTeam from "@/components/MeetTheTeam";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import TrustBar from "@/components/TrustBar";
import { useSEO } from "@/lib/seo";

const Index = () => {
  useSEO({
    title: "Steve Safari Agency — Jobs Abroad for Kenyans",
    description:
      "Verified recruitment + document services for Kenyans applying to Canada and beyond. Transparent fees, real receipts, M-Pesa payments.",
    canonical: "https://work-leap-kenya.lovable.app/",
  });
  return (
    <div className="min-h-screen">
      <TrustBar />
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <FeaturedJobs />
        <ServicesSection />
        <HowItWorks />
        <SuccessStories />
        <MeetTheTeam />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
