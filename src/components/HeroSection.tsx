import { motion } from "framer-motion";
import { ArrowRight, MapPin, Briefcase, Sparkles } from "lucide-react";
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
    <section className="relative min-h-[88vh] sm:min-h-[92vh] flex items-center overflow-hidden">
      {/* Background image + layered gradients */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Professionals ready for international careers"
          className="w-full h-full object-cover scale-105"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/80 to-primary/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--safari-gold)/0.25),transparent_55%)]" />
      </div>

      {/* Floating decorative orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-safari-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 w-64 h-64 rounded-full bg-safari-cream/10 blur-3xl" />

      <div className="container relative z-10 section-y-lg page-x">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-safari-cream/10 backdrop-blur-md border border-safari-gold/40 mb-7 shadow-lg">
              <Sparkles size={14} className="text-safari-gold" />
              <span className="text-xs sm:text-sm font-semibold text-safari-cream tracking-wide">
                {str("hero_badge", "Kenya to Canada & Beyond")}
              </span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="font-heading font-extrabold text-safari-cream leading-[1.05] tracking-tight mb-6 text-display"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {titleA}{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-safari-gold via-safari-gold-light to-safari-gold bg-clip-text text-transparent">
                {titleB}
              </span>
              <span className="absolute left-0 bottom-1 sm:bottom-2 h-2 sm:h-3 w-full bg-safari-gold/30 -z-0 rounded-sm" aria-hidden />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-base sm:text-lg md:text-xl text-safari-cream/85 mb-9 max-w-xl font-body leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {str(
              "hero_subtitle",
              "We connect talented Kenyans with high-paying jobs abroad. Verified, transparent, M-Pesa secured."
            )}
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <Button variant="hero" size="lg" className="tap shadow-elevated" onClick={primaryCta}>
              {str("hero_cta_primary", "Get Started")}
              <ArrowRight size={18} />
            </Button>
            <Button variant="hero-outline" size="lg" className="tap" asChild>
              <Link to="/jobs">
                <Briefcase size={18} />
                {str("hero_cta_secondary", "Browse Jobs")}
              </Link>
            </Button>
          </motion.div>

          {/* Stats card */}
          <motion.div
            className="mt-10 sm:mt-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="inline-flex flex-wrap items-stretch gap-0 rounded-2xl bg-safari-cream/10 backdrop-blur-md border border-safari-cream/15 px-2 py-2 shadow-elevated">
              {stats.map((stat, i) => (
                <div key={stat.label} className="flex items-center">
                  <div className="px-4 sm:px-6 py-2 text-center">
                    <div className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-safari-gold leading-none">
                      {stat.value}
                    </div>
                    <div className="text-[11px] sm:text-xs text-safari-cream/70 mt-1.5 uppercase tracking-wider font-medium">
                      {stat.label}
                    </div>
                  </div>
                  {i < stats.length - 1 && (
                    <span className="hidden sm:block w-px h-10 bg-safari-cream/20" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Soft bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none" />
    </section>
  );
};

export default HeroSection;
