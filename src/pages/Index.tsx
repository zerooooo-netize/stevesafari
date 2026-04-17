import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedJobs from "@/components/FeaturedJobs";
import ServicesSection from "@/components/ServicesSection";
import HowItWorks from "@/components/HowItWorks";
import SuccessStories from "@/components/SuccessStories";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <FeaturedJobs />
        <ServicesSection />
        <HowItWorks />
        <SuccessStories />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
