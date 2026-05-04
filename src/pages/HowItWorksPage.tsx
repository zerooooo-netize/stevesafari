import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustBar from "@/components/TrustBar";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/lib/seo";
import { ShieldCheck, Clock, FileText, CreditCard, Plane, AlertCircle, CheckCircle2 } from "lucide-react";

const STAGES = [
 { icon: FileText, title: "1. Register & Choose Path", time: "5 minutes", desc: "Create your free account and pick whether you' re applying for jobs abroad or just need document services."},
 { icon: FileText, title: "2. Submit Documents", time: "1–3 days", desc: "Upload your CV, ID, passport copy and any certificates. We' ll tell you exactly what' s missing."},
 { icon: CreditCard, title: "3. Pay Application Fee", time: "Instant via M-Pesa", desc: "Pay the full fee or secure your slot with a deposit (where allowed). Receipt sent immediately."},
 { icon: ShieldCheck, title: "4. Verification & Processing", time: "2–4 weeks", desc: "Our team reviews your documents and prepares your job application package."},
 { icon: Plane, title: "5. Travel Batch Assignment", time: "Varies by destination", desc: "Once verified and fully paid, you' re assigned to a travel batch with departure prep."},
];

const HowItWorksPage = () =>{
 useSEO({
 title: "How It Works — Steve Safari Agency",
 description:
 "Full transparency on every step, every fee, and every timeline. See exactly how we help Kenyans secure jobs abroad — no hidden costs.",
 });

 const [jobs, setJobs] = useState<any[]>([]);
 const [services, setServices] = useState<any[]>([]);
 const [settings, setSettings] = useState<Record<string, string>>({});

 useEffect(() =>{
 Promise.all([
 supabase.from("jobs").select(" title, country, application_fee, currency, deposit_enabled, deposit_type, deposit_value").eq("is_active", true),
 supabase.from("services").select(" name, price, currency, description").eq("is_active", true),
 supabase.from("settings").select(" key,value").in("key", ["business_name", "business_phone", "business_email", "sponsorship_fee"]),
 ]).then(([j, s, st]) =>{
 setJobs(j.data || []);
 setServices(s.data || []);
 const map: Record<string, string>= {};
 (st.data || []).forEach((r: any) => (map[r.key] = r.value));
 setSettings(map);
 });
 }, []);

 return (
 <div className="min-h-screen bg-background"><TrustBar /><Navbar /><main className="pt-20 pb-16">{/* Hero */}
 <section className="container py-10 text-center"><span className="text-sm font-medium text-safari-gold uppercase tracking-wider">Full Transparency</span><h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground mt-2 mb-4">How Our Process Works
 </h1><p className="text-muted-foreground max-w-2xl mx-auto">Every stage, every fee, every timeline — laid out clearly. No hidden costs, no surprises.
 </p><div className="flex flex-wrap justify-center gap-3 mt-6"><span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full"><CheckCircle2 size={14} />All fees listed upfront
 </span><span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full"><CheckCircle2 size={14} />Receipt for every payment
 </span><span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full"><CheckCircle2 size={14} />M-Pesa secured via Kopo Kopo
 </span></div></section>{/* Stages */}
 <section className="container max-w-3xl"><h2 className="font-heading text-2xl font-bold mb-6">The 5 Stages</h2><div className="space-y-4">{STAGES.map((s, i) => (
 <div key={i} className="bg-card border border-border rounded-xl p-5 flex gap-4 shadow-card"><div className="w-10 h-10 rounded-full bg-safari-gold/15 text-safari-gold flex items-center justify-center shrink-0"><s.icon size={20} /></div><div className="flex-1"><div className="flex items-start justify-between gap-2 flex-wrap"><h3 className="font-heading font-semibold text-foreground">{s.title}</h3><span className="text-xs inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-muted-foreground"><Clock size={11} />{s.time}
 </span></div><p className="text-sm text-muted-foreground mt-2">{s.desc}</p></div></div>))}
 </div></section>{/* Fees */}
 <section className="container max-w-3xl mt-12"><h2 className="font-heading text-2xl font-bold mb-2">All Fees, Right Here</h2><p className="text-sm text-muted-foreground mb-6">Live data from our system. Updated by admin in real-time.
 </p><div className="bg-card border border-border rounded-xl overflow-hidden shadow-card"><div className="bg-muted/50 p-4 border-b border-border"><h3 className="font-heading font-semibold text-sm">Job Application Fees</h3></div><div className="divide-y divide-border">{jobs.length === 0 && (
 <p className="p-4 text-sm text-muted-foreground text-center">No active jobs at the moment.</p>)}
 {jobs.map((j, i) =>{
 const dep = j.deposit_enabled
 ? j.deposit_type === "fixed"? `KES ${Number(j.deposit_value).toLocaleString()}`: `${j.deposit_value}% (KES ${Math.round((Number(j.application_fee) * Number(j.deposit_value)) / 100).toLocaleString()})`: null;
 return (
 <div key={i} className="p-4 flex items-center justify-between gap-3 flex-wrap"><div><p className="font-medium text-sm">{j.title}</p><p className="text-xs text-muted-foreground">{j.country}</p></div><div className="text-right"><p className="font-bold text-safari-gold text-sm">KES {Number(j.application_fee).toLocaleString()}</p>{dep && <p className="text-[11px] text-muted-foreground">Deposit: {dep}</p>}
 </div></div>);
 })}
 </div></div><div className="bg-card border border-border rounded-xl overflow-hidden shadow-card mt-5"><div className="bg-muted/50 p-4 border-b border-border"><h3 className="font-heading font-semibold text-sm">Document Service Fees</h3></div><div className="divide-y divide-border">{services.length === 0 && (
 <p className="p-4 text-sm text-muted-foreground text-center">No services listed.</p>)}
 {services.map((s, i) => (
 <div key={i} className="p-4 flex items-center justify-between gap-3 flex-wrap"><div><p className="font-medium text-sm">{s.name}</p>{s.description && <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>}
 </div><p className="font-bold text-safari-gold text-sm">{s.currency} {Number(s.price).toLocaleString()}</p></div>))}
 </div></div>{settings.sponsorship_fee && (
 <div className="bg-muted/40 border border-border rounded-xl p-4 mt-5 text-sm"><p className="font-semibold mb-1">Sponsorship Application Fee</p><p className="text-muted-foreground text-xs">Can' t afford the full process? Apply for sponsorship for KES {Number(settings.sponsorship_fee).toLocaleString()}. Admin reviews each request.
 </p></div>)}
 </section>{/* Anti-scam */}
 <section className="container max-w-3xl mt-12"><div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5"><div className="flex items-start gap-3"><AlertCircle className="text-yellow-700 shrink-0 mt-0.5" size={20} /><div className="text-sm"><p className="font-semibold text-yellow-900 mb-2">Important — your safety</p><ul className="list-disc list-inside text-yellow-900 space-y-1 text-xs"><li>We <strong>never</strong>ask for payments outside this platform.</li><li>All transactions are recorded and traceable.</li><li>You receive an official receipt instantly after every payment.</li><li>Need help? Call {settings.business_phone || "us"} or email {settings.business_email || "us"}.</li></ul></div></div></div></section></main><Footer /></div>);
};

export default HowItWorksPage;
