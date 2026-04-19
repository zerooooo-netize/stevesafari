import { motion } from "framer-motion";
import { ArrowRight, MapPin, Briefcase } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const primaryCta = () => navigate(user ? "/welcome" : "/auth?redirect=/welcome");

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Professionals ready for international careers"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50" />
      </div>

      <div className="container relative z-10 py-16 md:py-28">
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-safari-gold/20 border border-safari-gold/30 mb-6">
              <MapPin size={14} className="text-safari-gold" />
              <span className="text-xs font-medium text-safari-cream">Kenya → Canada & Beyond</span>
            </div>
          </motion.div>

          <motion.h1
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-safari-cream leading-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Your Gateway to <span className="text-safari-gold">Global Careers</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-safari-cream/80 mb-8 max-w-lg font-body"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            We connect talented Kenyans with high-paying jobs abroad. Verified, transparent, M-Pesa secured.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <Button variant="hero" size="lg" className="text-base" onClick={primaryCta}>
              Get Started <ArrowRight size={18} />
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base" asChild>
              <Link to="/jobs"><Briefcase size={18} /> Browse Jobs</Link>
            </Button>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-8 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {[
              { value: "500+", label: "Placed Abroad" },
              { value: "50+", label: "Partner Companies" },
              { value: "98%", label: "Success Rate" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-heading text-2xl md:text-3xl font-bold text-safari-gold">{stat.value}</div>
                <div className="text-xs text-safari-cream/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
