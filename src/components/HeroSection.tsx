import { motion } from "framer-motion";
import { ArrowRight, MapPin, Briefcase } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/useSettings";
import heroBanner from "@/assets/bg-canada.jpg";

const HERO_KEYS = [
  "hero_title", "hero_subtitle", "hero_badge",
  "hero_cta_primary", "hero_cta_secondary",
  "hero_stat_1_value", "hero_stat_1_label",
  "hero_stat_2_value", "hero_stat_2_label",
  "hero_stat_3_value", "hero_stat_3_label",
];

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { str } = useSettings(HERO_KEYS);

  const primaryCta = () => navigate(user ? "/welcome" : "/auth?redirect=/welcome");

  const title = str("hero_title", "Your Gateway to Global Careers");
  const [titleA, ...rest] = title.split(/\s+(?=\S+$)/);
  const titleB = rest[0] || "";

  const stats = [
    { value: str("hero_stat_1_value", "500+"), label: str("hero_stat_1_label", "Placed Abroad") },
    { value: str("hero_stat_2_value", "50+"), label: str("hero_stat_2_label", "Partner Companies") },
    { value: str("hero_stat_3_value", "98%"), label: str("hero_stat_3_label", "Success Rate") },
  ];

  return (
    <section className="relative min-h-[80vh] sm:min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBanner} alt="Professionals ready for international careers" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50" />
      </div>

      <div className="container relative z-10 section-y page-x">
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-safari-gold/20 border border-safari-gold/30 mb-5">
              <MapPin size={14} className="text-safari-gold" />
              <span className="text-xs font-medium text-safari-cream">{str("hero_badge", "Kenya to Canada & Beyond")}</span>
            </div>
          </motion.div>

          <motion.h1 className="font-heading font-bold text-safari-cream leading-tight mb-5" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            {titleA} <span className="text-safari-gold">{titleB}</span>
          </motion.h1>

          <motion.p className="text-base sm:text-lg md:text-xl text-safari-cream/80 mb-7 max-w-lg font-body" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            {str("hero_subtitle", "We connect talented Kenyans with high-paying jobs abroad. Verified, transparent, M-Pesa secured.")}
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-3" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}>
            <Button variant="hero" size="lg" onClick={primaryCta}>
              {str("hero_cta_primary", "Get Started")} <ArrowRight size={18} />
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/jobs"><Briefcase size={18} /> {str("hero_cta_secondary", "Browse Jobs")}</Link>
            </Button>
          </motion.div>

          <motion.div className="flex flex-wrap gap-6 sm:gap-8 mt-8 sm:mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}>
            {stats.map((stat) => (
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
