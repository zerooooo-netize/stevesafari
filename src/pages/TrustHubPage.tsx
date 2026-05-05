import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustBar from "@/components/TrustBar";
import MeetTheTeam from "@/components/MeetTheTeam";
import SuccessStories from "@/components/SuccessStories";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/lib/seo";
import {
  ShieldCheck, CheckCircle2, AlertTriangle, Phone, Mail, MapPin,
  CreditCard, FileCheck, Receipt, Award,
} from "lucide-react";

const TrustHubPage = () => {
  useSEO({
    title: "Trust & Verification - Steve Safari Agency",
    description: "Why hundreds of Kenyans trust Steve Safari with their journey abroad - verified team, transparent pricing, real receipts, and anti-scam protections.",
    canonical: "https://work-leap-kenya.lovable.app/trust",
  });

  const [s, setS] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("settings").select("key,value")
      .in("key", ["business_name", "business_phone", "business_email", "whatsapp_number", "business_address"])
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((r: any) => (map[r.key] = r.value));
        setS(map);
      });
  }, []);

  const guarantees = [
    { icon: ShieldCheck, title: "Verified Agency", desc: "Registered Kenyan business with traceable office address and contact details." },
    { icon: Receipt, title: "Receipt for every payment", desc: "Instant PDF receipt sent to your email after every M-Pesa transaction." },
    { icon: CreditCard, title: "M-Pesa via Kopo Kopo", desc: "All payments routed through Kopo Kopo's verified merchant pipeline - never to private numbers." },
    { icon: FileCheck, title: "Document privacy", desc: "Your CV, passport and ID are encrypted and only seen by assigned admins." },
    { icon: Award, title: "500+ placed abroad", desc: "Track record of successful placements you can verify in our success stories." },
    { icon: CheckCircle2, title: "Refund policy", desc: "If we cannot place you after full verification, your application fee is refundable. See terms below." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TrustBar />
      <Navbar />
      <main className="pt-20 pb-16">
        {/* Hero */}
        <section className="bg-[image:var(--gradient-hero)] py-12 sm:py-20 text-safari-cream">
          <div className="container max-w-3xl text-center">
            <span className="inline-flex items-center gap-1 text-xs bg-safari-gold/20 text-safari-gold px-3 py-1 rounded-full font-medium mb-4">
              <ShieldCheck size={12} /> 100% Transparent
            </span>
            <h1 className="font-heading text-3xl sm:text-5xl font-bold mb-4">Trust & Verification Hub</h1>
            <p className="text-safari-cream/80 max-w-xl mx-auto">
              Everything you need to verify we're a real agency - our team, our process, our payment proof, and our promises.
            </p>
          </div>
        </section>

        {/* Guarantees grid */}
        <section className="container max-w-5xl py-12">
          <h2 className="font-heading text-2xl font-bold text-center mb-8">Our 6 Promises to You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {guarantees.map((g, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-card">
                <div className="w-10 h-10 rounded-lg bg-safari-gold/15 text-safari-gold grid place-items-center mb-3">
                  <g.icon size={20} />
                </div>
                <h3 className="font-heading font-semibold mb-1">{g.title}</h3>
                <p className="text-xs text-muted-foreground">{g.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process snapshot */}
        <section className="container max-w-3xl py-8">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card">
            <h2 className="font-heading text-2xl font-bold mb-2">How we work - at a glance</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Every fee, every step, every timeline is published on our <Link to="/how-it-works" className="text-safari-gold underline">How It Works</Link> page. Live data, updated in real-time.
            </p>
            <Button asChild variant="outline" size="lg">
              <Link to="/how-it-works">View full process & fees →</Link>
            </Button>
          </div>
        </section>

        {/* Anti-scam */}
        <section className="container max-w-3xl py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="text-yellow-700 shrink-0 mt-0.5" size={22} />
              <h2 className="font-heading text-xl font-bold text-yellow-900">Avoid scams - read this carefully</h2>
            </div>
            <ul className="text-sm text-yellow-900 space-y-2 list-disc list-inside ml-1">
              <li>We <strong>never</strong> ask for payments to private M-Pesa numbers, bank accounts, or personal phones.</li>
              <li>Every payment is initiated through an <strong>STK push generated by our system</strong>. If you didn't request it, refuse it.</li>
              <li>If anyone calls claiming to be from Steve Safari and asks for money outside this platform - it's a scam. Hang up and report to us.</li>
              <li>Always verify by calling our official line <strong>{s.business_phone || "-"}</strong> or emailing <strong>{s.business_email || "-"}</strong>.</li>
            </ul>
          </div>
        </section>

        {/* Team */}
        <section className="py-8">
          <MeetTheTeam />
        </section>

        {/* Stories */}
        <section className="py-8">
          <SuccessStories />
        </section>

        {/* Contact */}
        <section className="container max-w-3xl py-12">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card">
            <h2 className="font-heading text-2xl font-bold mb-4">Talk to a real human</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {s.business_phone && (
                <a href={`tel:${s.business_phone.replace(/\s/g, "")}`} className="flex items-start gap-2 hover:text-safari-gold">
                  <Phone size={18} className="text-safari-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{s.business_phone}</p>
                  </div>
                </a>
              )}
              {s.business_email && (
                <a href={`mailto:${s.business_email}`} className="flex items-start gap-2 hover:text-safari-gold">
                  <Mail size={18} className="text-safari-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium break-all">{s.business_email}</p>
                  </div>
                </a>
              )}
              {s.business_address && (
                <div className="flex items-start gap-2">
                  <MapPin size={18} className="text-safari-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Office</p>
                    <p className="font-medium">{s.business_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrustHubPage;
