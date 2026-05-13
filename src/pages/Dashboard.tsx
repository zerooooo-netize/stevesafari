// Dashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
 User, FileText, CreditCard, Upload, LogOut, Settings,
 Briefcase, ShoppingBag, Check, Phone, Loader2, Gift,
 Download, Shield, Lock, ChevronRight, Trophy, Star,
 ArrowRight, CheckCircle2, Circle, Award, Sparkles, RefreshCw, AlertCircle
} from "lucide-react";
import ReferralCard from "@/components/ReferralCard";
import SponsorshipCard from "@/components/SponsorshipCard";
import ApplicationTracker from "@/components/ApplicationTracker";
import DiscountCodeInput from "@/components/DiscountCodeInput";
import TrustBar from "@/components/TrustBar";
import PreApplicationChecklist from "@/components/PreApplicationChecklist";
import { downloadReceiptPDF } from "@/lib/receipt";
import { useSettings } from "@/hooks/useSettings";
import { withRetry } from "@/lib/dbRetry";
import JourneyStatus from "@/components/JourneyStatus";

// --- Reusable M-Pesa Payment Widget (Extended for registration & services) ---
interface MpesaPaymentWidgetProps {
 userId: string;
 applications?: any[]; // optional – for application fees
 paymentType: string;
 fixedAmount?: number; // for registration fee
 serviceId?: string; // for service orders
 onPaymentComplete: () =>void;
 compact?: boolean;
}

const MpesaPaymentWidget = ({
 userId,
 applications = [],
 paymentType,
 fixedAmount,
 serviceId,
 onPaymentComplete,
 compact = false
}: MpesaPaymentWidgetProps) =>{
 const [phone, setPhone] = useState("+254");
 const [amount, setAmount] = useState(fixedAmount ? String(fixedAmount) : "");
 const [selectedApp, setSelectedApp] = useState("");
 const [payMode, setPayMode] = useState<"full"| "deposit">("full");
 const [sending, setSending] = useState(false);
 const [pollId, setPollId] = useState<string | null>(null);
 const [payStatus, setPayStatus] = useState<string | null>(null);
 const [discount, setDiscount] = useState<{
 code: string | null;
 discountAmount: number;
 finalAmount: number;
 source: "manual"| "referral_auto"| null;
 }>({ code: null, discountAmount: 0, finalAmount: 0, source: null });

 const STK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mpesa-stk-push`;

 const selectedAppRow = applications.find(a =>a.id === selectedApp);
 const job = selectedAppRow?.jobs;
 const fullFee = Number(job?.application_fee || 0);
 const depositEnabled = !!job?.deposit_enabled;
 const depositValue = Number(job?.deposit_value || 0);
 const depositAmount = job?.deposit_type === "fixed"? depositValue
 : Math.round((fullFee * depositValue) / 100);

 const applyJob = (id: string) =>{
 setSelectedApp(id);
 const a = applications.find(x =>x.id === id);
 if (a?.jobs?.application_fee) {
 setAmount(String(a.jobs.application_fee));
 setPayMode("full");
 }
 };

 const setMode = (mode: "full"| "deposit") =>{
 setPayMode(mode);
 if (mode === "deposit"&& depositAmount >0) {
 setAmount(String(depositAmount));
 } else if (mode === "full"&& fullFee >0) {
 setAmount(String(fullFee));
 }
 };

 const initiate = async () =>{
 if (!phone || phone.length< 12) { toast.error("Enter a valid phone number (+254...)"); return; }
 const finalAmountValue = discount.finalAmount >0 ? discount.finalAmount : parseFloat(amount);
 if (!finalAmountValue || finalAmountValue<= 0) { toast.error("Enter a valid amount"); return; }

 const isDeposit = payMode === "deposit"&& !!selectedApp;
 const balanceRemaining = isDeposit ? Math.max(fullFee - parseFloat(amount), 0) : 0;

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
 phone, amount: finalAmountValue, userId,
 applicationId: selectedApp || null,
 paymentType, isDeposit, balanceRemaining,
 serviceId: serviceId || null,
 description: `${paymentType.replace("_", "")} payment`,
 discountCode: discount.code,
 discountAmount: discount.discountAmount,
 finalAmount: finalAmountValue,
 }),
 });
 const data = await resp.json();
 if (!resp.ok) throw new Error(data.error || " Payment failed");

 toast.success(data.message || " Check your phone for M-Pesa prompt! ");
 setPollId(data.paymentId);
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
 clearInterval(interval);
 setPayStatus("completed");
 setSending(false);
 toast.success(`Payment received! Receipt ${statusData.receipt_number || ""}`);
 onPaymentComplete();
 } else if (statusData.status === "failed") {
 clearInterval(interval);
 setPayStatus("failed");
 setSending(false);
 toast.error("Payment failed. Please try again.");
 }
 } catch { /* keep polling */ }
 }, 5000);
 } catch (e: any) {
 toast.error(e.message);
 setPayStatus(null);
 setSending(false);
 }
 };

 return (
<div className={`border border-border rounded-xl p-4 bg-muted/30 ${compact ? 'mb-2': 'mb-4'}`}>{!compact && (
<h3 className="font-heading font-medium text-sm mb-3 flex items-center gap-2"><Phone size={16} className="text-safari-gold"/>Pay via M-Pesa
</h3>)}

 {payStatus === "waiting"? (
<div className="text-center py-6"><Loader2 size={32} className="animate-spin mx-auto text-safari-gold mb-3"/><p className="font-medium text-sm">Check your phone!</p><p className="text-xs text-muted-foreground mt-1">Enter your M-Pesa PIN when prompted.</p></div>) : payStatus === "completed"? (
<div className="text-center py-6"><CheckCircle2 size={32} className="mx-auto text-green-600 mb-3"/><p className="font-medium text-sm text-green-700">Payment Successful!</p><p className="text-xs text-muted-foreground mt-1">Receipt sent to your email.</p><Button size="sm" variant="outline" className="mt-3" onClick={() =>{ setPayStatus(null); setAmount(fixedAmount ? String(fixedAmount) : ""); }}>Make Another Payment
</Button></div>) : (
<div className="space-y-3"><div className="grid grid-cols-1 gap-3">{applications.length >0 && !fixedAmount && (
<div className="sm:col-span-2"><Label className="text-xs">Pay for which application?</Label><select value={selectedApp} onChange={e =>applyJob(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm"><option value="">- Generic payment -</option>{applications.map(a =><option key={a.id} value={a.id}>{a.jobs?.title || "Application"} (KES {Number(a.jobs?.application_fee || 0).toLocaleString()})</option>)}
</select></div>)}

 {selectedApp && depositEnabled && depositAmount >0 && (
<div className="sm:col-span-2 flex gap-2"><button type="button" onClick={() =>setMode("full")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${payMode === "full"? " bg-primary text-primary-foreground border-primary": " bg-background border-border"}`}>Pay Full (KES {fullFee.toLocaleString()})
</button><button type="button" onClick={() =>setMode("deposit")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${payMode === "deposit"? " bg-primary text-primary-foreground border-primary": " bg-background border-border"}`}>Deposit Only (KES {depositAmount.toLocaleString()})
</button></div>)}

<div><Label className="text-xs">Phone Number *</Label><Input value={phone} onChange={e =>setPhone(e.target.value)} placeholder="+254712345678" className="text-sm"/></div>{!fixedAmount && (
<div><Label className="text-xs">Amount (KES) *</Label><Input type="number" value={amount} onChange={e =>setAmount(e.target.value)} placeholder="5000" className="text-sm"/></div>)}
 {!selectedApp && !fixedAmount && (
<div><Label className="text-xs">Payment For</Label><select value={paymentType} onChange={e =>{}} className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm" disabled><option value={paymentType}>{paymentType.replace("_", "")}</option></select></div>)}
</div>{!fixedAmount && (
<DiscountCodeInput
 userId={userId}
 baseAmount={parseFloat(amount) || 0}
 applyTo={paymentType === "service_payment"? "service": "application_fee"}
 onChange={setDiscount}
 />)}
 {discount.discountAmount >0 && (
<div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">Original: KES {(parseFloat(amount) || 0).toLocaleString()} • Discount: −KES {discount.discountAmount.toLocaleString()} •<strong>You pay: KES {discount.finalAmount.toLocaleString()}</strong></div>)}
<div className="text-[11px] text-muted-foreground bg-muted/30 rounded p-2 flex items-start gap-1.5"><Shield size={12} className="text-safari-gold mt-0.5 shrink-0"/><span>Securely processed via M-Pesa. Official receipt provided.</span></div><Button onClick={initiate} disabled={sending} className="w-full text-sm">{sending ?<><Loader2 size={14} className="animate-spin mr-1"/>Processing...</>: `Pay KES ${(discount.finalAmount >0 ? discount.finalAmount : parseFloat(amount) || 0).toLocaleString()} with M-Pesa`}
</Button>{payStatus === "failed"&&<p className="text-xs text-destructive text-center">Payment failed. Try again.</p>}
 {payStatus === "timeout"&&<p className="text-xs text-yellow-600 text-center">Payment not confirmed. Check history.</p>}
</div>)}
</div>);
};

// --- Level Progress Bar (Game-like) ---
const LevelProgress = ({ currentLevel, maxLevel = 5 }: { currentLevel: number; maxLevel?: number }) =>{
 const levels = [
 { name: "Registration", icon: User },
 { name: "Profile", icon: Settings },
 { name: "Apply Jobs", icon: Briefcase },
 { name: "Documents", icon: FileText },
 { name: "Complete", icon: Trophy },
 ];

 return (
<div className="mb-8"><div className="flex items-center justify-between mb-2"><h3 className="font-heading font-semibold text-sm flex items-center gap-1"><Sparkles size={16} className="text-safari-gold"/>Your Journey
</h3><span className="text-xs text-muted-foreground">Level {currentLevel}/{maxLevel}</span></div><div className="relative"><div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 z-0"/><div className="relative z-10 flex justify-between">{levels.slice(0, maxLevel).map((level, idx) =>{
 const isCompleted = idx< currentLevel - 1;
 const isCurrent = idx === currentLevel - 1;
 const isLocked = idx >currentLevel - 1;
 const Icon = level.icon;
 return (
<div key={idx} className="flex flex-col items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
 isCompleted ? " bg-green-500 text-white":
 isCurrent ? " bg-safari-gold text-white ring-4 ring-safari-gold/20":
 " bg-muted text-muted-foreground"}`}>{isCompleted ?<CheckCircle2 size={16} />: idx + 1}
</div><span className="text-[10px] mt-1 text-center hidden sm:block">{level.name}</span></div>);
 })}
</div></div></div>);
};

// --- Main Dashboard Component ---
const Dashboard = () =>{
 const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();
 const navigate = useNavigate();
 const [applications, setApplications] = useState<any[]>([]);
 const [serviceOrders, setServiceOrders] = useState<any[]>([]);
 const [payments, setPayments] = useState<any[]>([]);
 const [documents, setDocuments] = useState<any[]>([]);
 const [activeServices, setActiveServices] = useState<any[]>([]);
 const [editing, setEditing] = useState(false);
 const [form, setForm] = useState({
 full_name: "", phone: "", address: "", id_number: "",
 passport_number: "", date_of_birth: "", nationality: "Kenyan"});
 const [uploading, setUploading] = useState(false);
 const [docType, setDocType] = useState("cv");
 const [activeSection, setActiveSection] = useState("profile");
 const [showRegistrationPayment, setShowRegistrationPayment] = useState(false);
 const [selectedServiceForPayment, setSelectedServiceForPayment] = useState<any | null>(null);
 const [uploadedDocForService, setUploadedDocForService] = useState<any>(null);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [dataLoading, setDataLoading] = useState(true);

 // Registration fee + path requirement loaded from DB (no hardcoded amounts)
 const { num: settingNum, str: settingStr, loading: settingsLoading } = useSettings([
 "registration_fee",
 "registration_fee_required_for",
 "max_active_applications",
 ]);
 const REGISTRATION_FEE = settingNum("registration_fee", 0);
 const requiredFor = settingStr("registration_fee_required_for", "jobs")
 .split(",").map(s =>s.trim().toLowerCase()).filter(Boolean);
 const userPath = (profile?.chosen_path || "").toLowerCase();
 // Services-only users skip registration fee
 const needsRegistration = !!userPath && requiredFor.includes(userPath) && !profile?.registration_fee_paid;

 useEffect(() =>{
 if (!user) return;
 loadData();
 }, [user]);

 useEffect(() =>{
 if (profile) {
 setForm({
 full_name: profile.full_name || "",
 phone: profile.phone || "",
 address: profile.address || "",
 id_number: profile.id_number || "",
 passport_number: profile.passport_number || "",
 date_of_birth: profile.date_of_birth || "",
 nationality: profile.nationality || "Kenyan",
 });
 }
 }, [profile]);

 const loadData = async () =>{
 setLoadError(null);
 setDataLoading(true);
 try {
 const [appsRes, paysRes, docsRes, ordersRes, servicesRes] = await withRetry(() =>Promise.all([
 supabase.from("applications").select("*, jobs(title, country, salary, application_fee, deposit_enabled, deposit_type, deposit_value)").eq("user_id", user!.id),
 supabase.from("payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
 supabase.from("documents").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
 supabase.from("service_orders").select("*, services(name, price, currency)").eq("user_id", user!.id).order("created_at", { ascending: false }),
 supabase.from("services").select(" id, name, price, currency").eq("is_active", true).order("name"),
 ])
 );
 setApplications(appsRes.data || []);
 setPayments(paysRes.data || []);
 setDocuments(docsRes.data || []);
 setServiceOrders(ordersRes.data || []);
 setActiveServices(servicesRes.data || []);
 } catch (e: any) {
 setLoadError(e?.message || " Could not load your dashboard data. Tap retry.");
 } finally {
 setDataLoading(false);
 }
 };

 const saveProfile = async () =>{
 const { error } = await supabase.from("profiles").update(form).eq("user_id", user!.id);
 if (error) { toast.error("Failed to update profile"); return; }
 toast.success("Profile updated! ");
 setEditing(false);
 refreshProfile();
 };

 const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) =>{
 const file = e.target.files?.[0];
 if (!file || !user) return;
 setUploading(true);
 const filePath = `${user.id}/${Date.now()} _${file.name}`;
 const { error: uploadErr } = await supabase.storage.from("user-documents").upload(filePath, file);
 if (uploadErr) { toast.error("Upload failed: "+ uploadErr.message); setUploading(false); return; }
 const { data: urlData } = supabase.storage.from("user-documents").getPublicUrl(filePath);
 const { data: docData, error: insertErr } = await supabase.from("documents").insert({
 user_id: user.id,
 document_type: docType,
 file_url: urlData.publicUrl,
 file_name: file.name,
 application_id: applications.length >0 ? applications[0].id : null,
 }).select().single();
 if (insertErr) { toast.error(insertErr.message); } else { 
 toast.success("Document uploaded! ");
 setUploadedDocForService(docData);
 loadData(); 
 }
 setUploading(false);
 };

 // Compute current level based on profile completion
 const getCurrentLevel = () =>{
 if (!profile?.registration_fee_paid) return 1;
 const profileCompleted = profile.full_name && profile.phone && profile.id_number;
 if (!profileCompleted) return 2;
 if (applications.length === 0) return 3;
 // If they have at least one application with paid status, move to level 4
 const hasPaidApp = applications.some(app =>app.status === "paid"|| app.status === "deposit_paid");
 if (!hasPaidApp) return 3;
 if (documents.length === 0) return 4;
 return 5; // Complete
 };

 const currentLevel = getCurrentLevel();
 const maxLevel = 5;

 // If registration not paid AND user' s chosen path requires it (jobs path), show payment gate.
 // Services-only users skip this entirely.
 if (needsRegistration) {
 return (
<div className="min-h-screen bg-background"><Navbar /><main className="pt-24 sm:pt-28 section-y-sm page-x"><div className="max-w-2xl mx-auto"><div className="text-center mb-6"><h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2">Welcome to Steve Safari!</h1><p className="text-muted-foreground">Complete your one‑time registration to unlock job applications.</p></div><LevelProgress currentLevel={1} maxLevel={maxLevel} /><div className="bg-card border border-border rounded-2xl p-6 shadow-lg"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-full bg-safari-gold/10 flex items-center justify-center"><Trophy size={24} className="text-safari-gold"/></div><div><h2 className="font-heading font-semibold text-lg">Step 1: Registration Fee</h2><p className="text-sm text-muted-foreground">One-time payment to join our agency.</p></div></div>{settingsLoading ? (
<div className="text-center py-6 text-sm text-muted-foreground"><Loader2 className="inline animate-spin mr-1" size={14} />Loading fee…</div>) : REGISTRATION_FEE<= 0 ? (
<div className="bg-destructive/10 text-destructive rounded p-3 text-sm">Registration fee is not configured. Please contact support.
</div>) : !showRegistrationPayment ? (
<div className="space-y-4"><div className="bg-muted/30 rounded-xl p-4"><p className="text-sm mb-2">Registration Fee:<span className="font-bold text-lg">KES {REGISTRATION_FEE.toLocaleString()}</span></p><p className="text-xs text-muted-foreground">This fee covers agency processing and unlocks all job applications.</p></div><Button onClick={() =>setShowRegistrationPayment(true)} className="w-full" size="lg">Pay Registration Fee<ArrowRight size={16} className="ml-2"/></Button><Button variant="ghost" size="sm" className="w-full text-xs" onClick={() =>navigate("/welcome")}>← Switch to Document Services (no fee)
</Button></div>) : (
<MpesaPaymentWidget
 userId={user!.id}
 paymentType="registration_fee" fixedAmount={REGISTRATION_FEE}
 onPaymentComplete={() =>{
 refreshProfile();
 toast.success("Registration complete! You can now apply for jobs.");
 setShowRegistrationPayment(false);
 }}
 />)}
</div></div></main><Footer /></div>);
 }

 // Registration paid - show full dashboard
 return (
<div className="min-h-screen bg-background"><Navbar /><main className="pt-24 sm:pt-28 section-y-sm page-x"><div className="max-w-4xl mx-auto">{/* Welcome header */}
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3"><div><h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">Welcome, {profile?.full_name || "Explorer"}!
 {currentLevel === maxLevel &&<Award size={20} className="text-safari-gold"/>}
</h1><p className="text-muted-foreground text-xs sm:text-sm">{user?.email}</p></div><div className="flex gap-2 w-full sm:w-auto">{isAdmin && (
<Button variant="outline" size="sm" className="flex-1 sm:flex-initial text-xs" onClick={() =>navigate("/admin")}><Settings size={14} />Admin
</Button>)}
<Button variant="ghost" size="sm" className="flex-1 sm:flex-initial text-xs" onClick={signOut}><LogOut size={14} />Sign Out
</Button></div></div>{/* Retry banner if any data failed to load */}
 {loadError && (
<div className="mb-4 bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-center justify-between gap-3"><div className="flex items-start gap-2 text-sm"><AlertCircle size={18} className="text-destructive shrink-0 mt-0.5"/><div><p className="font-medium text-destructive">Couldn' t load all your data</p><p className="text-xs text-muted-foreground">{loadError}</p></div></div><Button size="sm" variant="outline" onClick={loadData} disabled={dataLoading}><RefreshCw size={14} className={`mr-1 ${dataLoading ? 'animate-spin': ''}`} />Retry
</Button></div>)}

 {/* Onboarding journey status - shows what' s done and what' s next */}
<JourneyStatus chosenPath={profile?.chosen_path} />{/* Game-like level progress */}
<LevelProgress currentLevel={currentLevel} maxLevel={maxLevel} />{/* Section tabs with lock states */}
<div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-4 px-4 scrollbar-hide">{[
 { key: "profile", label: "Profile", icon: User, minLevel: 2 },
 { key: "applications", label: "Applications", icon: Briefcase, minLevel: 3 },
 { key: "documents", label: "Documents", icon: FileText, minLevel: 4 },
 { key: "services", label: "Services", icon: ShoppingBag, minLevel: 2 },
 { key: "payments", label: "Payments", icon: CreditCard, minLevel: 2 },
 { key: "refer", label: "Refer & Earn", icon: Gift, minLevel: 2 },
 { key: "sponsorship", label: "Sponsorship", icon: Gift, minLevel: 2 },
 ].map((s) =>{
 const isLocked = currentLevel< s.minLevel;
 return (
<button
 key={s.key}
 onClick={() =>!isLocked && setActiveSection(s.key)}
 disabled={isLocked}
 className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
 activeSection === s.key && !isLocked
 ? " bg-primary text-primary-foreground": isLocked
 ? " bg-muted/50 text-muted-foreground cursor-not-allowed": " bg-muted text-muted-foreground hover:bg-muted/80"}`}
 >{isLocked ?<Lock size={12} />:<s.icon size={12} />}
 {s.label}
</button>);
 })}
</div>{/* Profile Section (Level 2) */}
 {activeSection === "profile"&& (
<section className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card"><div className="flex items-center justify-between mb-4"><h2 className="font-heading font-semibold flex items-center gap-2 text-base sm:text-lg"><User size={18} />My Profile
 {profile?.full_name && profile.phone && profile.id_number && (
<CheckCircle2 size={16} className="text-green-500 ml-1"/>)}
</h2><Button variant="outline" size="sm" className="text-xs" onClick={() =>setEditing(!editing)}>{editing ? "Cancel": " Edit"}
</Button></div>{editing ? (
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label className="text-xs">Full Name</Label><Input value={form.full_name} onChange={e =>setForm({ ...form, full_name: e.target.value })} className="text-sm"/></div><div><Label className="text-xs">Phone (e.g. +254...)</Label><Input value={form.phone} onChange={e =>setForm({ ...form, phone: e.target.value })} placeholder="+254 7XX XXX XXX" className="text-sm"/></div><div><Label className="text-xs">ID Number</Label><Input value={form.id_number} onChange={e =>setForm({ ...form, id_number: e.target.value })} className="text-sm"/></div><div><Label className="text-xs">Passport Number</Label><Input value={form.passport_number} onChange={e =>setForm({ ...form, passport_number: e.target.value })} className="text-sm"/></div><div><Label className="text-xs">Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e =>setForm({ ...form, date_of_birth: e.target.value })} className="text-sm"/></div><div><Label className="text-xs">Nationality</Label><Input value={form.nationality} onChange={e =>setForm({ ...form, nationality: e.target.value })} className="text-sm"/></div><div className="sm:col-span-2"><Label className="text-xs">Address</Label><Input value={form.address} onChange={e =>setForm({ ...form, address: e.target.value })} className="text-sm"/></div><Button onClick={saveProfile} className="sm:col-span-2 text-sm">Save Profile</Button></div>) : (
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"><div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">Name</span><span className="font-medium">{profile?.full_name || "-"}</span></div><div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">Phone</span><span className="font-medium">{profile?.phone || "-"}</span></div><div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">ID Number</span><span className="font-medium">{profile?.id_number || "-"}</span></div><div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">Passport</span><span className="font-medium">{profile?.passport_number || "-"}</span></div><div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">Date of Birth</span><span className="font-medium">{profile?.date_of_birth || "-"}</span></div><div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">Address</span><span className="font-medium">{profile?.address || "-"}</span></div></div>)}
 {currentLevel === 2 && profile?.full_name && profile.phone && profile.id_number && (
<div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"><p className="text-sm flex items-center gap-2"><CheckCircle2 size={16} className="text-green-600"/>Profile complete! Level 3 unlocked.
</p></div>)}
</section>)}

 {/* Applications Section (Level 3) */}
 {activeSection === "applications"&& (
<section className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card"><h2 className="font-heading font-semibold flex items-center gap-2 mb-4 text-base sm:text-lg">My Applications</h2>{applications.length === 0 ? (
<div className="text-center py-8"><Briefcase size={40} className="mx-auto text-muted-foreground/30 mb-3"/><p className="text-muted-foreground text-sm mb-3">No applications yet</p><Button size="sm" onClick={() =>navigate("/jobs")}>Browse Jobs</Button></div>) : (
<div className="space-y-4">{applications.map((app) =>{
 const statusSteps = ["registered", "deposit_paid", "paid", "documents_submitted", "verified", "batch_assigned", "completed"];
 const statusLabels: Record<string, string>= {
 registered: "Registered", deposit_paid: "Deposit Paid", paid: "Paid in Full",
 documents_submitted: "Docs Sent", verified: " Verified", batch_assigned: " Batch Ready",
 completed: "Complete", rejected: "Rejected",
 };
 const getProgressIndex = (status: string) =>statusSteps.indexOf(status);
 return (
<div key={app.id} className="border border-border rounded-xl p-4"><div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3"><div><h3 className="font-semibold text-sm">{app.jobs?.title}</h3><p className="text-xs text-muted-foreground">{app.jobs?.country} • {app.jobs?.salary}</p></div><span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${app.status === 'rejected'? ' bg-destructive/10 text-destructive': ' bg-safari-gold/10 text-safari-gold'}`}>{statusLabels[app.status] || app.status}
</span></div>{app.status !== "rejected"&& (
<div className="space-y-1"><div className="flex gap-1">{statusSteps.map((step, i) =>(
<div key={step} className={`h-2.5 flex-1 rounded-full transition-colors ${i<= getProgressIndex(app.status) ? 'bg-safari-gold': 'bg-muted'}`} />))}
</div><p className="text-[10px] text-muted-foreground text-center">Step {getProgressIndex(app.status) + 1} of {statusSteps.length}: {statusLabels[app.status]}
</p></div>)}
 {/* Payment widget for applications that need fee */}
 {app.status === "registered"&& app.jobs?.application_fee >0 && (
<div className="mt-3"><MpesaPaymentWidget
 userId={user!.id}
 applications={[app]}
 paymentType="application_fee" onPaymentComplete={loadData}
 compact
 /></div>)}
 {/* Inline pre-application checklist gate */}
 {!["verified","batch_assigned","completed","rejected"].includes(app.status) && (
<div className="mt-3"><PreApplicationChecklist
 userId={user!.id}
 applicationId={app.id}
 jobFee={Number(app.jobs?.application_fee || 0)}
 onReady={loadData}
 /></div>)}
</div>);
 })}
</div>)}
</section>)}

 {/* Documents Section with Service Payment Flow (Level 4) */}
 {activeSection === "documents"&& (
<section className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card"><h2 className="font-heading font-semibold flex items-center gap-2 mb-4 text-base sm:text-lg">My Documents</h2>{/* Upload area */}
<div className="border-2 border-dashed border-border rounded-xl p-4 mb-4 bg-muted/30"><div className="flex flex-col sm:flex-row items-start sm:items-center gap-3"><select
 value={docType}
 onChange={(e) =>setDocType(e.target.value)}
 className="w-full sm:w-auto border border-border rounded-lg px-3 py-2 bg-background text-sm"><option value="cv">CV / Resume</option><option value="passport">Passport Copy</option><option value="id_card">ID Card</option><option value="certificate">Certificate</option><option value="photo">Passport Photo</option><option value="other">Other</option></select><label className="flex-1 w-full"><div className="flex items-center justify-center gap-2 px-4 py-3 bg-safari-gold/10 text-safari-gold rounded-lg cursor-pointer hover:bg-safari-gold/20 transition-colors text-sm font-medium"><Upload size={16} />{uploading ? " Uploading...": "Tap to Upload File"}
</div><input type="file" className="hidden" onChange={uploadDocument} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/></label></div></div>{/* After upload, offer dynamic services from DB (no hardcoded amounts) */}
 {uploadedDocForService && !selectedServiceForPayment && activeServices.length >0 && (
<div className="mb-4 p-4 border border-safari-gold/30 bg-safari-gold/5 rounded-xl"><p className="text-sm font-medium mb-2">Document uploaded! Need professional processing?</p><div className="space-y-2">{activeServices.map((s) =>(
<Button key={s.id} variant="outline" size="sm" className="w-full justify-start" onClick={() =>setSelectedServiceForPayment(s)}><FileText size={14} className="mr-2"/>{s.name} ({s.currency || "KES"} {Number(s.price).toLocaleString()})
</Button>))}
<Button variant="ghost" size="sm" className="w-full" onClick={() =>setUploadedDocForService(null)}>Skip for now
</Button></div></div>)}

 {selectedServiceForPayment && typeof selectedServiceForPayment === "object"&& (
<div className="mb-4"><MpesaPaymentWidget
 userId={user!.id}
 paymentType="service_payment" serviceId={selectedServiceForPayment.id}
 fixedAmount={Number(selectedServiceForPayment.price)}
 onPaymentComplete={() =>{
 toast.success("Payment successful! Service order created.");
 setSelectedServiceForPayment(null);
 setUploadedDocForService(null);
 loadData();
 }}
 /></div>)}

 {/* Document list */}
<h3 className="font-medium text-sm mt-6 mb-3">Uploaded Documents</h3>{documents.length === 0 ? (
<p className="text-muted-foreground text-sm text-center py-4">No documents uploaded yet</p>) : (
<div className="space-y-2">{documents.map((doc) =>(
<div key={doc.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{doc.file_name || doc.document_type}</p><p className="text-xs text-muted-foreground capitalize">{doc.document_type.replace("_", "")} • {doc.status}</p></div><a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-safari-gold hover:underline shrink-0 ml-2">View
</a></div>))}
</div>)}
</section>)}

 {/* Service Orders Section */}
 {activeSection === "services"&& (
<section className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card"><h2 className="font-heading font-semibold flex items-center gap-2 mb-4 text-base sm:text-lg">My Service Orders</h2>{serviceOrders.length === 0 ? (
<div className="text-center py-8"><ShoppingBag size={40} className="mx-auto text-muted-foreground/30 mb-3"/><p className="text-muted-foreground text-sm mb-3">No service orders yet</p><Button size="sm" onClick={() =>navigate("/services")}>Browse Services</Button></div>) : (
<div className="space-y-3">{serviceOrders.map((order) =>(
<div key={order.id} className="border border-border rounded-xl p-4"><div className="flex justify-between items-start gap-2"><div><h3 className="font-semibold text-sm">{(order.services as any)?.name}</h3><p className="text-xs text-muted-foreground">{(order.services as any)?.currency} {Number((order.services as any)?.price).toLocaleString()}</p>{order.details &&<p className="text-xs text-muted-foreground mt-1">{order.details}</p>}
</div><span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
 order.status === 'completed'? ' bg-green-100 text-green-700': 
 order.status === 'rejected'? ' bg-destructive/10 text-destructive': 
 ' bg-safari-gold/10 text-safari-gold'}`}>{order.status}
</span></div>{order.completed_file_url && order.status === "completed"? (
<a href={order.completed_file_url} target="_blank" rel="noreferrer" className="text-xs text-safari-gold hover:underline mt-2 inline-block">Download Completed File
</a>) : order.completed_file_url && order.status !== "completed"? (
<div className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5 bg-muted/50 rounded p-2"><Lock size={12} />File ready - complete full payment to download.
</div>) : null}
</div>))}
</div>)}
</section>)}

 {/* Payments Section */}
 {activeSection === "payments"&& (
<section className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card"><h2 className="font-heading font-semibold flex items-center gap-2 mb-4 text-base sm:text-lg">Payments</h2>{/* Payment History */}
<h3 className="font-heading font-medium text-sm mb-3">Payment History</h3>{payments.length === 0 ? (
<p className="text-muted-foreground text-sm text-center py-4">No payments yet</p>) : (
<div className="space-y-2">{payments.map((p) =>(
<div key={p.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3"><div><p className="text-sm font-medium">{p.currency} {Number(p.amount).toLocaleString()}</p><p className="text-xs text-muted-foreground capitalize">{p.payment_type?.replace("_", "")} • {new Date(p.created_at).toLocaleDateString()}</p></div><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'completed'? ' bg-green-100 text-green-700': p.status === 'failed'? ' bg-red-100 text-red-700': ' bg-yellow-100 text-yellow-700'}`}>{p.status === "completed"? "": p.status === "failed"? "": ""} {p.status}
</span></div>))}
</div>)}
</section>)}

 {/* Refer & Earn Section */}
 {activeSection === "refer"&& (
<ReferralCard userId={user!.id} referralCode={profile?.referral_code || null} />)}

 {/* Sponsorship Section */}
 {activeSection === "sponsorship"&& (
<SponsorshipCard userId={user!.id} />)}

<div className="grid grid-cols-2 gap-3 mt-6"><Button variant="outline" className="h-14 text-sm" onClick={() =>navigate("/jobs")}>Browse Jobs
</Button><Button variant="outline" className="h-14 text-sm" onClick={() =>navigate("/services")}>Our Services
</Button></div></div></main><Footer /></div>);
};

export default Dashboard;
