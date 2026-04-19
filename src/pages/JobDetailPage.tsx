import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustBar from "@/components/TrustBar";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/lib/seo";
import { toast } from "sonner";
import {
  MapPin, DollarSign, Clock, Briefcase, Users, ShieldCheck,
  CheckCircle2, ArrowLeft, FileText, CreditCard, AlertCircle, Loader2,
} from "lucide-react";

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [existingApp, setExistingApp] = useState<any>(null);

  useSEO({
    title: job ? `${job.title} — ${job.country} | Steve Safari` : "Job Detail | Steve Safari",
    description: job?.description?.slice(0, 155) || "Apply for verified job opportunities abroad through Steve Safari Agency.",
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("jobs").select("*").eq("id", id).eq("is_active", true).maybeSingle();
      setJob(data);
      if (user && data) {
        const { data: app } = await supabase
          .from("applications").select("id, status").eq("user_id", user.id).eq("job_id", data.id).maybeSingle();
        setExistingApp(app);
      }
      setLoading(false);
    })();
  }, [id, user]);

  const handleApply = async () => {
    if (!user) {
      navigate(`/auth?redirect=/jobs/${id}`);
      return;
    }
    if (existingApp) {
      navigate("/dashboard");
      return;
    }
    setApplying(true);
    const { data, error } = await supabase
      .from("applications").insert({ user_id: user.id, job_id: job.id, status: "registered" }).select("id").single();
    setApplying(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Application started! Complete the checklist next.");
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="animate-spin text-safari-gold" size={28} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container pt-24 pb-16 text-center">
          <p className="text-muted-foreground">Job not found or no longer active.</p>
          <Link to="/jobs" className="text-safari-gold underline mt-4 inline-block">← Back to all jobs</Link>
        </main>
      </div>
    );
  }

  const fee = Number(job.application_fee || 0);
  const depositEnabled = !!job.deposit_enabled;
  const depositAmount = depositEnabled
    ? job.deposit_type === "fixed"
      ? Number(job.deposit_value)
      : Math.round((fee * Number(job.deposit_value)) / 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <TrustBar />
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container max-w-4xl">
          <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft size={14} /> All Jobs
          </Link>

          {/* Hero */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <span className="inline-flex items-center gap-1 text-xs bg-safari-gold/15 text-safari-gold px-2.5 py-1 rounded-full font-medium">
                  <Briefcase size={12} /> {job.job_type || "Full-Time"}
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-3">{job.title}</h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                  <MapPin size={14} /> {job.city ? `${job.city}, ` : ""}{job.country}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Application Fee</p>
                <p className="font-heading text-2xl font-bold text-safari-gold">KES {fee.toLocaleString()}</p>
                {depositEnabled && depositAmount > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    or KES {depositAmount.toLocaleString()} deposit
                  </p>
                )}
              </div>
            </div>

            {/* Quick info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Salary</p>
                <p className="font-medium text-sm flex items-center gap-1 mt-0.5">
                  <DollarSign size={13} className="text-safari-gold" />
                  {job.salary || "Negotiable"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Slots</p>
                <p className="font-medium text-sm flex items-center gap-1 mt-0.5">
                  <Users size={13} className="text-safari-gold" />
                  {job.slots_available || "Open"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Deadline</p>
                <p className="font-medium text-sm flex items-center gap-1 mt-0.5">
                  <Clock size={13} className="text-safari-gold" />
                  {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Open"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Currency</p>
                <p className="font-medium text-sm mt-0.5">{job.currency || "CAD"}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6">
              <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
                <FileText size={18} className="text-safari-gold" /> About this role
              </h2>
              <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{job.description}</p>
            </section>
          )}

          {/* Requirements */}
          {job.requirements && (
            <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6">
              <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-safari-gold" /> Requirements
              </h2>
              <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{job.requirements}</p>
            </section>
          )}

          {/* What you get / process */}
          <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6">
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-safari-gold" /> What happens after you apply
            </h2>
            <ol className="space-y-3 text-sm">
              {[
                "Complete your profile + upload required documents (CV, ID, passport).",
                "Pay the application fee (full or deposit) via M-Pesa — instant receipt.",
                "Our team verifies your documents within 2–4 business days.",
                "Once verified, you're assigned to a travel batch.",
                "Final visa & travel logistics handled — you fly out."
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-safari-gold/15 text-safari-gold grid place-items-center text-xs font-bold shrink-0">{i + 1}</span>
                  <span className="text-foreground/90">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Trust strip */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <ShieldCheck className="text-green-700 shrink-0 mt-0.5" size={20} />
            <div className="text-xs text-green-900">
              <p className="font-semibold mb-1">Safe & verified</p>
              <p>All payments via M-Pesa (Kopo Kopo). Receipt sent instantly. Refund possible if we cannot place you. <Link to="/trust" className="underline font-medium">Read trust policy →</Link></p>
            </div>
          </div>

          {/* Sticky CTA */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border -mx-4 px-4 py-4 sm:rounded-2xl sm:border sm:mx-0 sm:px-6 sm:py-5 sm:relative sm:bg-card sm:shadow-elevated">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="font-heading font-bold text-foreground">
                  {existingApp ? "✅ You've already applied" : "Ready to apply?"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {existingApp ? `Status: ${existingApp.status.replace("_", " ")}` : `Start with KES ${(depositEnabled ? depositAmount : fee).toLocaleString()}`}
                </p>
              </div>
              <Button size="lg" onClick={handleApply} disabled={applying} className="text-base">
                {applying ? <><Loader2 size={16} className="animate-spin mr-1" /> Starting...</> :
                 existingApp ? "Go to Dashboard" :
                 user ? "Apply Now" : "Sign In to Apply"}
              </Button>
            </div>
          </div>

          {/* Anti-scam */}
          <div className="mt-6 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <AlertCircle className="text-yellow-700 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-yellow-900">
              We <strong>never</strong> ask for payments outside this platform. Always pay via the M-Pesa STK push generated here.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JobDetailPage;
