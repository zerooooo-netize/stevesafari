import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustBar from "@/components/TrustBar";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/lib/seo";
import { Clock, CheckCircle2, Shield, AlertTriangle } from "lucide-react";

const STAGES = [
  {
    number: 1,
    title: "Create your account and choose your path",
    time: "About 5 minutes",
    details:
      "Sign up for free. Tell us whether you need a job abroad or help with documents only.",
  },
  {
    number: 2,
    title: "Upload your documents",
    time: "1–3 days",
    details:
      "We’ll list exactly what you need: CV, ID, passport copy, certificates. You can upload them any time.",
  },
  {
    number: 3,
    title: "Pay your application fee",
    time: "Instant with M‑Pesa",
    details:
      "Pay the full amount or a deposit (if available). You get a receipt immediately after payment.",
  },
  {
    number: 4,
    title: "We verify and process your application",
    time: "2–4 weeks",
    details:
      "Our team checks everything and prepares your job application package.",
  },
  {
    number: 5,
    title: "Travel batch assignment",
    time: "Depends on destination",
    details:
      "Once verified and fully paid, we assign you to a travel group and guide you through departure steps.",
  },
];

const HowItWorksPage = () => {
  useSEO({
    title: "How It Works — Steve Safari Agency",
    description:
      "Full transparency on every step, fee, and timeline. See exactly how we help Kenyans secure jobs abroad — no hidden costs.",
  });

  const [jobs, setJobs] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      supabase
        .from("jobs")
        .select(
          "title, country, application_fee, currency, deposit_enabled, deposit_type, deposit_value"
        )
        .eq("is_active", true),
      supabase
        .from("services")
        .select("name, price, currency, description")
        .eq("is_active", true),
      supabase
        .from("settings")
        .select("key,value")
        .in("key", ["business_name", "business_phone", "business_email", "sponsorship_fee"]),
    ]).then(([j, s, st]) => {
      setJobs(j.data || []);
      setServices(s.data || []);
      const map: Record<string, string> = {};
      (st.data || []).forEach((r: any) => (map[r.key] = r.value));
      setSettings(map);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <TrustBar />
      <Navbar />
      <main className="pt-20 pb-16 max-w-4xl mx-auto px-4">
        {/* Page header – simple, no badges */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            How our process works
          </h1>
          <p className="mt-3 text-gray-500 max-w-lg mx-auto">
            Five clear steps. All fees listed. No surprises.
          </p>
        </header>

        {/* Steps – each as a simple numbered card */}
        <section aria-labelledby="steps-heading">
          <h2 id="steps-heading" className="sr-only">
            Application steps
          </h2>
          <ol className="space-y-5">
            {STAGES.map((step) => (
              <li
                key={step.number}
                className="flex gap-4 bg-gray-50 rounded-lg p-5 border border-gray-100"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-lg">
                  {step.number}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{step.details}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <Clock size={12} /> {step.time}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Fees – live data, simplified layout */}
        <section className="mt-16" aria-labelledby="fees-heading">
          <h2 id="fees-heading" className="text-2xl font-bold text-gray-900 mb-6">
            All fees
          </h2>

          {/* Job fees */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3">Job application fees</h3>
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-400">No active jobs at the moment.</p>
            ) : (
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {jobs.map((job, idx) => {
                  const deposit =
                    job.deposit_enabled && job.deposit_type === "fixed"
                      ? `Deposit: KES ${Number(job.deposit_value).toLocaleString()}`
                      : job.deposit_enabled && job.deposit_type === "percentage"
                      ? `Deposit: ${job.deposit_value}% (KES ${Math.round(
                          (Number(job.application_fee) * Number(job.deposit_value)) / 100
                        ).toLocaleString()})`
                      : null;
                  return (
                    <li
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">{job.country}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-700">
                          KES {Number(job.application_fee).toLocaleString()}
                        </p>
                        {deposit && (
                          <p className="text-xs text-gray-500 mt-0.5">{deposit}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Service fees */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3">Document service fees</h3>
            {services.length === 0 ? (
              <p className="text-sm text-gray-400">No services listed.</p>
            ) : (
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {services.map((svc, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between p-4 bg-white"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{svc.name}</p>
                      {svc.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {svc.description}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-blue-700">
                      {svc.currency} {Number(svc.price).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sponsorship fee */}
          {settings.sponsorship_fee && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-gray-900">Sponsorship application fee</p>
              <p className="text-gray-600 mt-1">
                If you cannot afford the full process, you can apply for sponsorship.
                The application fee is KES{" "}
                {Number(settings.sponsorship_fee).toLocaleString()}.
              </p>
            </div>
          )}
        </section>

        {/* Safety notice – plain language */}
        <section className="mt-16">
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-5 flex gap-3">
            <Shield className="text-yellow-700 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h2 className="font-semibold text-yellow-900 mb-2">Your safety matters</h2>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>We never ask you to pay outside this platform.</li>
                <li>All payments are tracked and you get a receipt instantly.</li>
                <li>
                  If you need help, call {settings.business_phone || "our office"} or email{" "}
                  {settings.business_email || "our team"}.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorksPage;
