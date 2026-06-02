import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, ArrowRight, LogOut, Sparkles, ShieldCheck, Globe2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const PathChoice = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from("settings").select("value").eq("key", "path_gate_enabled").maybeSingle();
      const enabled = data?.value !== "false";
      if (!enabled || profile?.chosen_path) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setChecking(false);
    };
    if (user) check(); else setChecking(false);
  }, [user, profile, navigate]);

  const choose = async (path: "jobs" | "services") => {
    if (!user) return;
    setLoading(path);
    const { error } = await supabase
      .from("profiles").update({ chosen_path: path }).eq("user_id", user.id);
    if (error) { toast.error(error.message); setLoading(null); return; }
    await refreshProfile();
    toast.success(path === "jobs" ? "Let's find you a job abroad!" : "Let's polish your documents!");
    navigate(path === "jobs" ? "/jobs" : "/services");
  };

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const paths = [
    {
      key: "jobs" as const,
      eyebrow: "Path 01",
      title: "Apply for Jobs Abroad",
      copy: "We'll match you to verified openings in Canada and beyond — then handle paperwork, batching, and travel logistics end-to-end.",
      icon: Briefcase,
      tone: "green" as const,
      points: ["Verified employers", "Full visa support", "Pay in KES"],
    },
    {
      key: "services" as const,
      eyebrow: "Path 02",
      title: "Improve My Documents",
      copy: "CV, cover letter, passport, visa, statements of purpose — refined by specialists who place candidates every week.",
      icon: FileText,
      tone: "gold" as const,
      points: ["Reviewed by specialists", "48-hour turnaround", "Unlimited revisions"],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Decorative editorial backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-safari-green/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-24 w-[32rem] h-[32rem] rounded-full bg-safari-gold/15 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5 border-b border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Steve Safari" className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <div className="font-heading font-extrabold tracking-tight text-foreground text-base sm:text-lg">
              Steve<span className="text-safari-gold">Safari</span>
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Recruitment · Est. Nairobi
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
          <LogOut size={14} /> Sign out
        </Button>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-8 py-10 sm:py-14">
        <div className="w-full max-w-5xl">
          {/* Title block */}
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/70 backdrop-blur-sm text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5">
              <Sparkles size={12} className="text-safari-gold" />
              Choose your journey
            </div>
            <h1 className="font-heading font-extrabold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl leading-[1.05]">
              Welcome, <span className="italic font-medium text-safari-green dark:text-safari-gold">{firstName}</span>.
              <br className="hidden sm:block" />
              Where would you like to begin?
            </h1>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Two doors. Both lead abroad. Pick the one that matches where you are right now —
              you can switch any time from your dashboard.
            </p>
          </div>

          {/* Path cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {paths.map((p) => {
              const Icon = p.icon;
              const isLoading = loading === p.key;
              const toneRing = p.tone === "green" ? "hover:border-safari-green" : "hover:border-safari-gold";
              const toneIconBg = p.tone === "green" ? "bg-safari-green/10 text-safari-green" : "bg-safari-gold/15 text-safari-gold";
              const toneAccent = p.tone === "green" ? "text-safari-green dark:text-safari-gold" : "text-safari-gold";
              const toneStripe = p.tone === "green"
                ? "from-safari-green/0 via-safari-green/0 to-safari-green/30"
                : "from-safari-gold/0 via-safari-gold/0 to-safari-gold/40";
              return (
                <button
                  key={p.key}
                  onClick={() => choose(p.key)}
                  disabled={loading !== null}
                  className={`group relative text-left bg-card border border-border/80 rounded-3xl p-7 sm:p-8 transition-all duration-300
                    hover:-translate-y-1 hover:shadow-[0_24px_60px_-20px_hsl(var(--safari-green)/0.25)]
                    ${toneRing} disabled:opacity-60 disabled:hover:translate-y-0`}
                >
                  {/* Eyebrow row */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
                      {p.eyebrow}
                    </span>
                    <div className={`w-12 h-12 rounded-2xl grid place-items-center ${toneIconBg} transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-110`}>
                      <Icon size={22} strokeWidth={2.2} />
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="font-heading font-bold text-2xl sm:text-[1.7rem] leading-tight text-foreground mb-3 tracking-tight">
                    {p.title}
                  </h2>

                  {/* Copy */}
                  <p className="text-[0.95rem] text-muted-foreground leading-relaxed mb-6">
                    {p.copy}
                  </p>

                  {/* Bullets */}
                  <ul className="space-y-2 mb-7">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2.5 text-sm text-foreground/80">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.tone === "green" ? "bg-safari-green" : "bg-safari-gold"}`} />
                        {pt}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className={`flex items-center justify-between border-t border-border/70 pt-5 ${toneAccent}`}>
                    <span className="font-semibold text-sm tracking-wide">
                      {isLoading ? "Setting up…" : "Begin this path"}
                    </span>
                    <span className="w-9 h-9 rounded-full bg-foreground/[0.04] grid place-items-center transition-all duration-300 group-hover:bg-foreground/[0.08] group-hover:translate-x-1">
                      <ArrowRight size={16} />
                    </span>
                  </div>

                  {/* Hover accent stripe */}
                  <div className={`absolute inset-x-7 bottom-0 h-px bg-gradient-to-r ${toneStripe} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </button>
              );
            })}
          </div>

          {/* Trust strip */}
          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={14} className="text-safari-green dark:text-safari-gold" />
              Vetted & licensed agency
            </span>
            <span className="hidden sm:inline text-border">·</span>
            <span className="inline-flex items-center gap-2">
              <Globe2 size={14} className="text-safari-green dark:text-safari-gold" />
              Active placements in 6 countries
            </span>
            <span className="hidden sm:inline text-border">·</span>
            <span>Switch paths any time from your dashboard</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PathChoice;
