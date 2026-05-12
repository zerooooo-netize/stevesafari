// JobDetailPage.tsx
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
 Sparkles, Lock, Trophy, Award, Star, ChevronRight, Phone, Upload,
} from "lucide-react";

import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/contexts/CurrencyContext";

// Reusable M-Pesa payment widget for the agency registration fee.
// Amount is provided by the parent (loaded from settings table).
const MpesaRegWidget = ({
 userId,
 amount,
 onPaymentComplete,
}: {
 userId: string;
 amount: number;
 onPaymentComplete: () =>void;
}) =>{
 const [phone, setPhone] = useState("+254");
 const [sending, setSending] = useState(false);
 const [payStatus, setPayStatus] = useState<string | null>(null);
 const STK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mpesa-stk-push`;

 const initiate = async () =>{
 if (!phone || phone.length< 12) { toast.error("Enter a valid phone number (+254...)"); return; }
 if (!amount || amount<= 0) { toast.error("Registration fee not configured. Please contact support."); return; }
 setSending(true);
 setPayStatus("sending");
 try {
 const resp = await fetch(STK_URL, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
 },
 body: JSON.stringify({
 phone, amount, userId,
 paymentType: "registration_fee",
 description: "Agency registration fee",
 }),
 });
 const data = await resp.json();
 if (!resp.ok) throw new Error(data.error || " Payment failed");
 toast.success("Check your phone for M-Pesa prompt! ");
 setPayStatus("waiting");
 let attempts = 0;
 const interval = setInterval(async () =>{
 attempts++;
 if (attempts >30) { clearInterval(interval); setPayStatus("timeout"); setSending(false); return; }
 try {
 const statusResp = await fetch(`${STK_URL}? action=status&payment_id=${data.paymentId}`, {
 headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`},
 });
 const statusData = await statusResp.json();
 if (statusData.status === "completed") {
 clearInterval(interval); setPayStatus("completed"); setSending(false);
 toast.success("Registration fee paid! ");
 onPaymentComplete();
 } else if (statusData.status === "failed") {
 clearInterval(interval); setPayStatus("failed"); setSending(false);
 toast.error("Payment failed. Try again.");
 }
 } catch { /* keep polling */ }
 }, 5000);
 } catch (e: any) {
 toast.error(e.message); setPayStatus(null); setSending(false);
 }
 };

 if (payStatus === "waiting") {
 return (
<div className="text-center py-6"><Loader2 size={32} className="animate-spin mx-auto text-safari-gold mb-3"/><p className="font-medium text-sm">Check your phone!</p><p className="text-xs text-muted-foreground mt-1">Enter M-Pesa PIN when prompted.</p></div>);
 }
 if (payStatus === "completed") {
 return (
<div className="text-center py-6"><CheckCircle2 size={32} className="mx-auto text-green-600 mb-3"/><p className="font-medium text-sm text-green-700">Registration Complete!</p><p className="text-xs text-muted-foreground mt-1">You can now apply for jobs.</p></div>);
 }
 return (
<div className="space-y-3"><div><label className="text-xs font-medium">Phone Number</label><input
 type="tel" value={phone} onChange={(e) =>setPhone(e.target.value)}
 placeholder="+254712345678" className="w-full border rounded-md px-3 py-2 text-sm bg-background"/></div><Button onClick={initiate} disabled={sending} className="w-full">{sending ?<><Loader2 size={14} className="animate-spin mr-1"/>Processing...</>: `Pay KES ${amount.toLocaleString()} with M-Pesa`}
</Button></div>);
};

const JobDetailPage = () =>{
 const { id } = useParams<{ id: string }>();
 const { user, profile, refreshProfile } = useAuth();
 const { format, formatSalary } = useCurrency();
 const navigate = useNavigate();
 const [job, setJob] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [applying, setApplying] = useState(false);
 const [existingApp, setExistingApp] = useState<any>(null);
 const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
 const { num: settingNum } = useSettings(["registration_fee", "max_active_applications"]);
 const REG_FEE = settingNum("registration_fee", 0);
 const MAX_APPS = settingNum("max_active_applications", 0);

 useSEO({
 title: job ? `${job.title} - ${job.country} | Steve Safari`: "Job Detail | Steve Safari",
 description: job?.description?.slice(0, 155) || " Apply for verified job opportunities abroad through Steve Safari Agency.",
 });

 useEffect(() =>{
 if (!id) return;
 (async () =>{
 const { data } = await supabase
 .from("jobs")
 .select("*")
 .eq("id", id)
 .eq("is_active", true)
 .maybeSingle();
 setJob(data);
 if (user && data) {
 const { data: app } = await supabase
 .from("applications")
 .select(" id, status")
 .eq("user_id", user.id)
 .eq("job_id", data.id)
 .maybeSingle();
 setExistingApp(app);
 }
 setLoading(false);
 })();
 }, [id, user]);

 const handleApply = async () =>{
 if (!user) {
 navigate(`/auth? redirect=/jobs/${id}`);
 return;
 }

 // Check registration fee paid (only required for the jobs path)
 if (!profile?.registration_fee_paid) {
 setShowRegistrationPrompt(true);
 return;
 }

 if (existingApp) {
 navigate("/dashboard");
 return;
 }

 // Enforce per-user active applications cap (default 3)
 const { count } = await supabase
 .from("applications")
 .select("id", { count: "exact", head: true })
 .eq("user_id", user.id)
 .not("status", "in", "(rejected,completed)");
 if (MAX_APPS >0 && (count || 0) >= MAX_APPS) {
 toast.error(`You can have at most ${MAX_APPS} active applications. Complete or cancel one first.`);
 return;
 }

 setApplying(true);
 const { error } = await supabase
 .from("applications")
 .insert({ user_id: user.id, job_id: job.id, status: "registered"})
 .select("id")
 .single();
 setApplying(false);
 if (error) {
 toast.error(error.message);
 return;
 }
 toast.success("Application started! Complete the checklist next.");
 navigate("/dashboard");
 };

 if (loading) {
 return (
<div className="min-h-screen grid place-items-center bg-background"><Loader2 className="animate-spin text-safari-gold" size={28} /></div>);
 }

 if (!job) {
 return (
<div className="min-h-screen bg-background"><Navbar /><main className="container pt-24 pb-16 text-center"><p className="text-muted-foreground">Job not found or no longer active.</p><Link to="/jobs" className="text-safari-gold underline mt-4 inline-block">← Back to all jobs
</Link></main></div>);
 }

 const fee = Number(job.application_fee || 0);
 const depositEnabled = !!job.deposit_enabled;
 const depositAmount = depositEnabled
 ? job.deposit_type === "fixed"? Number(job.deposit_value)
 : Math.round((fee * Number(job.deposit_value)) / 100)
 : 0;

 const isRegistered = profile?.registration_fee_paid;
 const hasApplied = !!existingApp;

 return (
<div className="min-h-screen bg-background"><TrustBar /><Navbar /><main className="pt-20 section-y page-x"><div className="container max-w-4xl">{/* Breadcrumb */}
<Link
 to="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"><ArrowLeft size={14} />Back to All Jobs
</Link>{/* Registration Fee Banner (if not paid) */}
 {user && !isRegistered && !showRegistrationPrompt && (
<div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3"><Lock className="text-amber-600 shrink-0 mt-0.5" size={18} /><div className="flex-1"><p className="font-medium text-sm">Complete registration to apply</p><p className="text-xs text-muted-foreground">A one‑time agency fee of {format(REG_FEE, "KES")} is required before you can apply for jobs.
</p></div><Button size="sm" variant="outline" onClick={() =>setShowRegistrationPrompt(true)}>Pay Now
</Button></div>)}

 {/* Registration Payment Modal (inline) */}
 {showRegistrationPrompt && (
<div className="mb-6 bg-card border border-safari-gold/30 rounded-xl p-5 shadow-lg"><h3 className="font-heading font-semibold text-lg mb-2 flex items-center gap-2"><Sparkles className="text-safari-gold" size={20} />Unlock Your Journey
</h3><p className="text-sm text-muted-foreground mb-4">Pay the {format(REG_FEE, "KES")} registration fee to apply for this job and access all agency services.
</p><MpesaRegWidget
 userId={user!.id}
 amount={REG_FEE}
 onPaymentComplete={async () =>{
 await refreshProfile();
 setShowRegistrationPrompt(false);
 toast.success("Registration complete! You can now apply.");
 }}
 /><button
 onClick={() =>setShowRegistrationPrompt(false)}
 className="text-xs text-muted-foreground hover:underline mt-3">Cancel
</button></div>)}

 {/* Hero Card */}
<div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6"><div className="flex flex-wrap items-start justify-between gap-3 mb-3"><div><span className="inline-flex items-center gap-1 text-xs bg-safari-gold/15 text-safari-gold px-2.5 py-1 rounded-full font-medium"><Briefcase size={12} />{job.job_type || "Full-Time"}
</span><h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-3">{job.title}
</h1><p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm"><MapPin size={14} />{job.city ? `${job.city}, `: ""}{job.country}
</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Application Fee</p><p className="font-heading text-2xl font-bold text-safari-gold">{format(fee, "KES")}
</p>{depositEnabled && depositAmount >0 && (
<p className="text-[11px] text-muted-foreground mt-0.5">or {format(depositAmount, "KES")} deposit
</p>)}
</div></div>{/* Quick Info Grid */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border"><div><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Salary</p><p className="font-medium text-sm flex items-center gap-1 mt-0.5 line-clamp-1"><DollarSign size={13} className="text-safari-gold shrink-0"/>{job.salary ? formatSalary(job.salary) : "Negotiable"}
</p></div><div><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Slots</p><p className="font-medium text-sm flex items-center gap-1 mt-0.5"><Users size={13} className="text-safari-gold"/>{job.slots_available || "Open"}
</p></div><div><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Deadline</p><p className="font-medium text-sm flex items-center gap-1 mt-0.5"><Clock size={13} className="text-safari-gold"/>{job.deadline ? new Date(job.deadline).toLocaleDateString() : "Open"}
</p></div><div><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Display</p><p className="font-medium text-sm mt-0.5">Live</p></div></div></div>{/* Description */}
 {job.description && (
<section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6"><h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2"><FileText size={18} className="text-safari-gold"/>About this role
</h2><p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{job.description}
</p></section>)}

 {/* Requirements */}
 {job.requirements && (
<section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6"><h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2"><CheckCircle2 size={18} className="text-safari-gold"/>Requirements
</h2><p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{job.requirements}
</p></section>)}

 {/* Application Process - Gamified Steps */}
<section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6"><h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2"><Trophy size={18} className="text-safari-gold"/>Your Application Journey
</h2><div className="relative"><div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted"/><ol className="space-y-5 relative">{[
 {
 title: "Complete Registration",
 desc: `Pay one‑time agency fee (${format(REG_FEE, "KES")}) to unlock job applications.`,
 icon: Lock,
 status: isRegistered ? "completed": "pending",
 },
 {
 title: "Apply for This Job",
 desc: `Start your application – fee ${format(fee, "KES")}${depositEnabled ? ` (or ${format(depositAmount, "KES")} deposit)`: ""}.`,
 icon: Briefcase,
 status: hasApplied ? "completed": isRegistered ? "available": "locked",
 },
 {
 title: "Upload Documents",
 desc: "Submit CV, passport copy, and required certificates.",
 icon: Upload,
 status: hasApplied ? "available": "locked",
 },
 {
 title: "Pay Application Fee",
 desc: "Complete payment via M‑Pesa to secure your slot.",
 icon: CreditCard,
 status: hasApplied ? "available": "locked",
 },
 {
 title: "Get Verified & Fly",
 desc: "Our team verifies documents, processes visa, and books travel.",
 icon: ShieldCheck,
 status: "locked",
 },
 ].map((step, idx) =>(
<li key={idx} className="flex gap-4"><div
 className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
 step.status === "completed"? " bg-green-500 text-white": step.status === "available"? " bg-safari-gold/20 text-safari-gold border-2 border-safari-gold": " bg-muted text-muted-foreground"}`}
 >{step.status === "completed"? (
<CheckCircle2 size={18} />) : (
<step.icon size={16} />)}
</div><div className="flex-1 pb-2"><p className="font-medium text-sm flex items-center gap-2">{step.title}
 {step.status === "completed"&& (
<span className="text-green-600 text-xs">Done</span>)}
</p><p className="text-xs text-muted-foreground">{step.desc}</p></div></li>))}
</ol></div></section>{/* Trust Strip */}
<div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6 flex items-start gap-3"><ShieldCheck className="text-green-700 dark:text-green-400 shrink-0 mt-0.5" size={20} /><div className="text-xs text-green-900 dark:text-green-100"><p className="font-semibold mb-1">Safe & Verified</p><p>All payments via M‑Pesa (Kopo Kopo). Receipt sent instantly. Refund possible if we cannot place you.{""}
<Link to="/trust" className="underline font-medium">Read trust policy →
</Link></p></div></div>{/* Sticky CTA */}
<div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border -mx-4 px-4 py-4 sm:rounded-2xl sm:border sm:mx-0 sm:px-6 sm:py-5 sm:relative sm:bg-card sm:shadow-elevated"><div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"><div className="text-center sm:text-left"><p className="font-heading font-bold text-foreground">{hasApplied
 ? " Application in Progress": isRegistered
 ? " Ready to Apply? ": "Complete Registration First"}
</p><p className="text-xs text-muted-foreground">{hasApplied
  ? `Status: ${existingApp.status.replace("_", "")}`: isRegistered
 ? `Start with ${format(depositEnabled ? depositAmount : fee, "KES")}`: `One‑time ${format(REG_FEE, "KES")} registration fee`}
</p></div><Button
 size="lg" onClick={handleApply}
 disabled={applying || (!isRegistered && !showRegistrationPrompt)}
 className="text-base">{applying ? (
<><Loader2 size={16} className="animate-spin mr-1"/>Starting...</>) : hasApplied ? ("Go to Dashboard") : !user ? ("Sign In to Apply") : !isRegistered ? ("Pay Registration Fee") : ("Apply Now")}
</Button></div></div>{/* Anti-scam Warning */}
<div className="mt-6 flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4"><AlertCircle className="text-yellow-700 dark:text-yellow-400 shrink-0 mt-0.5" size={16} /><p className="text-xs text-yellow-900 dark:text-yellow-100">We<strong>never</strong>ask for payments outside this platform. Always pay via the M‑Pesa STK push generated here.
</p></div></div></main><Footer /></div>);
};

export default JobDetailPage;
