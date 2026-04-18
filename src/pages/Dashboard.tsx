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
import { User, FileText, CreditCard, Upload, LogOut, Settings, Briefcase, ShoppingBag, Check, Phone, Loader2, Gift, Download, Shield } from "lucide-react";
import ReferralCard from "@/components/ReferralCard";
import SponsorshipCard from "@/components/SponsorshipCard";
import ApplicationTracker from "@/components/ApplicationTracker";
import DiscountCodeInput from "@/components/DiscountCodeInput";
import TrustBar from "@/components/TrustBar";
import { downloadReceiptPDF } from "@/lib/receipt";

// M-Pesa Payment Widget — deposit-aware
const MpesaPaymentWidget = ({ userId, applications, onPaymentComplete }: { userId: string; applications: any[]; onPaymentComplete: () => void }) => {
  const [phone, setPhone] = useState("+254");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("application_fee");
  const [selectedApp, setSelectedApp] = useState("");
  const [payMode, setPayMode] = useState<"full" | "deposit">("full");
  const [sending, setSending] = useState(false);
  const [pollId, setPollId] = useState<string | null>(null);
  const [payStatus, setPayStatus] = useState<string | null>(null);

  const STK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mpesa-stk-push`;

  // When app changes, prefill amount from job
  const selectedAppRow = applications.find(a => a.id === selectedApp);
  const job = selectedAppRow?.jobs;
  const fullFee = Number(job?.application_fee || 0);
  const depositEnabled = !!job?.deposit_enabled;
  const depositValue = Number(job?.deposit_value || 0);
  const depositAmount = job?.deposit_type === "fixed"
    ? depositValue
    : Math.round((fullFee * depositValue) / 100);

  const applyJob = (id: string) => {
    setSelectedApp(id);
    const a = applications.find(x => x.id === id);
    if (a?.jobs?.application_fee) {
      setPaymentType("application_fee");
      setAmount(String(a.jobs.application_fee));
      setPayMode("full");
    }
  };

  const setMode = (mode: "full" | "deposit") => {
    setPayMode(mode);
    if (mode === "deposit" && depositAmount > 0) {
      setAmount(String(depositAmount));
      setPaymentType("deposit");
    } else if (mode === "full" && fullFee > 0) {
      setAmount(String(fullFee));
      setPaymentType("application_fee");
    }
  };

  const initiate = async () => {
    if (!phone || phone.length < 12) { toast.error("Enter a valid phone number (+254...)"); return; }
    if (!amount || parseFloat(amount) <= 0) { toast.error("Enter a valid amount"); return; }

    const isDeposit = payMode === "deposit" && !!selectedApp;
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
          phone, amount: parseFloat(amount), userId,
          applicationId: selectedApp || null,
          paymentType, isDeposit, balanceRemaining,
          description: `${paymentType.replace("_", " ")} payment`,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Payment failed");

      toast.success(data.message || "Check your phone for M-Pesa prompt! 📱");
      setPollId(data.paymentId);
      setPayStatus("waiting");

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (attempts > 30) { clearInterval(interval); setPayStatus("timeout"); setSending(false); return; }
        try {
          const statusResp = await fetch(`${STK_URL}?action=status&payment_id=${data.paymentId}`, {
            headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          });
          const statusData = await statusResp.json();
          if (statusData.status === "completed") {
            clearInterval(interval);
            setPayStatus("completed");
            setSending(false);
            toast.success(`Payment received! ✅ Receipt ${statusData.receipt_number || ""}`);
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
    <div className="border border-border rounded-xl p-4 bg-muted/30 mb-4">
      <h3 className="font-heading font-medium text-sm mb-3 flex items-center gap-2">
        <Phone size={16} className="text-safari-gold" /> Pay via M-Pesa
      </h3>

      {payStatus === "waiting" ? (
        <div className="text-center py-6">
          <Loader2 size={32} className="animate-spin mx-auto text-safari-gold mb-3" />
          <p className="font-medium text-sm">📱 Check your phone!</p>
          <p className="text-xs text-muted-foreground mt-1">Enter your M-Pesa PIN when prompted. Waiting for confirmation...</p>
        </div>
      ) : payStatus === "completed" ? (
        <div className="text-center py-6">
          <Check size={32} className="mx-auto text-green-600 mb-3" />
          <p className="font-medium text-sm text-green-700">Payment Successful! ✅</p>
          <p className="text-xs text-muted-foreground mt-1">Receipt sent to your email.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => { setPayStatus(null); setAmount(""); }}>Make Another Payment</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {applications.length > 0 && (
              <div className="sm:col-span-2">
                <Label className="text-xs">Pay for which application?</Label>
                <select value={selectedApp} onChange={e => applyJob(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm">
                  <option value="">— Generic payment —</option>
                  {applications.map(a => <option key={a.id} value={a.id}>{a.jobs?.title || "Application"} (KES {Number(a.jobs?.application_fee || 0).toLocaleString()})</option>)}
                </select>
              </div>
            )}

            {selectedApp && depositEnabled && depositAmount > 0 && (
              <div className="sm:col-span-2 flex gap-2">
                <button type="button" onClick={() => setMode("full")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${payMode === "full" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}>
                  Pay Full (KES {fullFee.toLocaleString()})
                </button>
                <button type="button" onClick={() => setMode("deposit")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${payMode === "deposit" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}>
                  Deposit Only (KES {depositAmount.toLocaleString()})
                </button>
              </div>
            )}

            <div>
              <Label className="text-xs">Phone Number *</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254712345678" className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Amount (KES) *</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5000" className="text-sm" />
            </div>
            {!selectedApp && (
              <div className="sm:col-span-2">
                <Label className="text-xs">Payment For</Label>
                <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm">
                  <option value="application_fee">Application Fee</option>
                  <option value="deposit">Deposit</option>
                  <option value="balance">Balance Payment</option>
                  <option value="service_payment">Service Payment</option>
                  <option value="travel_fee">Travel Fee</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
          </div>
          <Button onClick={initiate} disabled={sending} className="w-full text-sm">
            {sending ? <><Loader2 size={14} className="animate-spin mr-1" /> Processing...</> : "📱 Pay with M-Pesa"}
          </Button>
          {payStatus === "failed" && <p className="text-xs text-destructive text-center">Payment failed. Please try again.</p>}
          {payStatus === "timeout" && <p className="text-xs text-yellow-600 text-center">Payment not confirmed yet. Check your payment history.</p>}
        </div>
      )}
    </div>
  );
};

const statusSteps = ["registered", "deposit_paid", "paid", "documents_submitted", "verified", "batch_assigned", "completed"];
const statusLabels: Record<string, string> = {
  registered: "✅ Registered",
  deposit_paid: "💳 Deposit Paid",
  paid: "💰 Paid in Full",
  documents_submitted: "📄 Docs Sent",
  verified: "✔️ Verified",
  batch_assigned: "✈️ Batch Ready",
  completed: "🎉 Complete",
  rejected: "❌ Rejected",
};

const Dashboard = () => {
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", id_number: "", passport_number: "", date_of_birth: "", nationality: "Kenyan" });
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("cv");
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  useEffect(() => {
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

  const loadData = async () => {
    const [appsRes, paysRes, docsRes, ordersRes] = await Promise.all([
      supabase.from("applications").select("*, jobs(title, country, salary, application_fee, deposit_enabled, deposit_type, deposit_value)").eq("user_id", user!.id),
      supabase.from("payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("documents").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("service_orders").select("*, services(name, price, currency)").eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setApplications(appsRes.data || []);
    setPayments(paysRes.data || []);
    setDocuments(docsRes.data || []);
    setServiceOrders(ordersRes.data || []);
  };

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update(form).eq("user_id", user!.id);
    if (error) { toast.error("Failed to update profile"); return; }
    toast.success("Profile updated! ✅");
    setEditing(false);
    refreshProfile();
  };

  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("user-documents").upload(filePath, file);
    if (uploadErr) { toast.error("Upload failed: " + uploadErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("user-documents").getPublicUrl(filePath);
    const { error: insertErr } = await supabase.from("documents").insert({
      user_id: user.id,
      document_type: docType,
      file_url: urlData.publicUrl,
      file_name: file.name,
      application_id: applications.length > 0 ? applications[0].id : null,
    });
    if (insertErr) { toast.error(insertErr.message); } else { toast.success("Document uploaded! 📄"); loadData(); }
    setUploading(false);
  };

  const getProgressIndex = (status: string) => {
    const idx = statusSteps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const sections = [
    { key: "profile", label: "👤 Profile", icon: User },
    { key: "applications", label: "📋 Applications", icon: Briefcase },
    { key: "documents", label: "📄 Documents", icon: FileText },
    { key: "services", label: "🛒 Services", icon: ShoppingBag },
    { key: "payments", label: "💰 Payments", icon: CreditCard },
    { key: "refer", label: "🎁 Refer & Earn", icon: Gift },
    { key: "sponsorship", label: "🤝 Sponsorship", icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Welcome header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div>
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                👋 Welcome, {profile?.full_name || "User"}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">{user?.email}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {isAdmin && (
                <Button variant="outline" size="sm" className="flex-1 sm:flex-initial text-xs" onClick={() => navigate("/admin")}>
                  <Settings size={14} /> Admin
                </Button>
              )}
              <Button variant="ghost" size="sm" className="flex-1 sm:flex-initial text-xs" onClick={signOut}>
                <LogOut size={14} /> Sign Out
              </Button>
            </div>
          </div>

          {/* Section tabs - scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-4 px-4 scrollbar-hide">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === s.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Profile Section */}
          {activeSection === "profile" && (
            <section className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold flex items-center gap-2 text-base sm:text-lg">👤 My Profile</h2>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditing(!editing)}>
                  {editing ? "Cancel" : "✏️ Edit"}
                </Button>
              </div>
              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label className="text-xs">Full Name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="text-sm" /></div>
                  <div><Label className="text-xs">Phone (e.g. +254...)</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254 7XX XXX XXX" className="text-sm" /></div>
                  <div><Label className="text-xs">ID Number</Label><Input value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })} className="text-sm" /></div>
                  <div><Label className="text-xs">Passport Number</Label><Input value={form.passport_number} onChange={e => setForm({ ...form, passport_number: e.target.value })} className="text-sm" /></div>
                  <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} className="text-sm" /></div>
                  <div><Label className="text-xs">Nationality</Label><Input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} className="text-sm" /></div>
                  <div className="sm:col-span-2"><Label className="text-xs">Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="text-sm" /></div>
                  <Button onClick={saveProfile} className="sm:col-span-2 text-sm">💾 Save Profile</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">Name</span><span className="font-medium">{profile?.full_name || "—"}</span></div>
                  <div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">Phone</span><span className="font-medium">{profile?.phone || "—"}</span></div>
                  <div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">ID Number</span><span className="font-medium">{profile?.id_number || "—"}</span></div>
                  <div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">Passport</span><span className="font-medium">{profile?.passport_number || "—"}</span></div>
                  <div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">Date of Birth</span><span className="font-medium">{profile?.date_of_birth || "—"}</span></div>
                  <div className="bg-muted/50 rounded-lg p-3"><span className="text-muted-foreground text-xs block">Address</span><span className="font-medium">{profile?.address || "—"}</span></div>
                </div>
              )}
            </section>
          )}

          {/* Applications Section */}
          {activeSection === "applications" && (
            <section className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card">
              <h2 className="font-heading font-semibold flex items-center gap-2 mb-4 text-base sm:text-lg">📋 My Applications</h2>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm mb-3">No applications yet</p>
                  <Button size="sm" onClick={() => navigate("/jobs")}>🔍 Browse Jobs</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border border-border rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                        <div>
                          <h3 className="font-semibold text-sm">{app.jobs?.title}</h3>
                          <p className="text-xs text-muted-foreground">{app.jobs?.country} • {app.jobs?.salary}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${app.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-safari-gold/10 text-safari-gold'}`}>
                          {statusLabels[app.status] || app.status}
                        </span>
                      </div>
                      {/* Visual progress */}
                      {app.status !== "rejected" && (
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            {statusSteps.map((step, i) => (
                              <div key={step} className={`h-2.5 flex-1 rounded-full transition-colors ${i <= getProgressIndex(app.status) ? 'bg-safari-gold' : 'bg-muted'}`} />
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground text-center">
                            Step {getProgressIndex(app.status) + 1} of {statusSteps.length}: {statusLabels[app.status]}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Documents Section */}
          {activeSection === "documents" && (
            <section className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card">
              <h2 className="font-heading font-semibold flex items-center gap-2 mb-4 text-base sm:text-lg">📄 My Documents</h2>
              
              {/* Upload area */}
              <div className="border-2 border-dashed border-border rounded-xl p-4 mb-4 bg-muted/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full sm:w-auto border border-border rounded-lg px-3 py-2 bg-background text-sm"
                  >
                    <option value="cv">📝 CV / Resume</option>
                    <option value="passport">🛂 Passport Copy</option>
                    <option value="id_card">🪪 ID Card</option>
                    <option value="certificate">🎓 Certificate</option>
                    <option value="photo">📸 Passport Photo</option>
                    <option value="other">📎 Other</option>
                  </select>
                  <label className="flex-1 w-full">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-safari-gold/10 text-safari-gold rounded-lg cursor-pointer hover:bg-safari-gold/20 transition-colors text-sm font-medium">
                      <Upload size={16} />
                      {uploading ? "Uploading..." : "📤 Tap to Upload File"}
                    </div>
                    <input type="file" className="hidden" onChange={uploadDocument} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                  </label>
                </div>
              </div>

              {/* Document list */}
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.file_name || doc.document_type}</p>
                        <p className="text-xs text-muted-foreground capitalize">{doc.document_type.replace("_", " ")} • {doc.status}</p>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-safari-gold hover:underline shrink-0 ml-2"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Service Orders Section */}
          {activeSection === "services" && (
            <section className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card">
              <h2 className="font-heading font-semibold flex items-center gap-2 mb-4 text-base sm:text-lg">🛒 My Service Orders</h2>
              {serviceOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm mb-3">No service orders yet</p>
                  <Button size="sm" onClick={() => navigate("/services")}>📄 Browse Services</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceOrders.map((order) => (
                    <div key={order.id} className="border border-border rounded-xl p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-semibold text-sm">{(order.services as any)?.name}</h3>
                          <p className="text-xs text-muted-foreground">{(order.services as any)?.currency} {Number((order.services as any)?.price).toLocaleString()}</p>
                          {order.details && <p className="text-xs text-muted-foreground mt-1">{order.details}</p>}
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          order.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 
                          'bg-safari-gold/10 text-safari-gold'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      {order.completed_file_url && (
                        <a href={order.completed_file_url} target="_blank" rel="noreferrer" className="text-xs text-safari-gold hover:underline mt-2 inline-block">
                          📥 Download Completed File
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Payments Section */}
          {activeSection === "payments" && (
            <section className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-card">
              <h2 className="font-heading font-semibold flex items-center gap-2 mb-4 text-base sm:text-lg">💰 Payments</h2>

              {/* M-Pesa Payment Form */}
              <MpesaPaymentWidget userId={user!.id} applications={applications} onPaymentComplete={loadData} />

              {/* Payment History */}
              <h3 className="font-heading font-medium text-sm mt-6 mb-3">📜 Payment History</h3>
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No payments yet</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium">{p.currency} {Number(p.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.payment_type?.replace("_", " ")} • {new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.status === "completed" ? "✅" : p.status === "failed" ? "❌" : "⏳"} {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Refer & Earn Section */}
          {activeSection === "refer" && (
            <ReferralCard userId={user!.id} referralCode={profile?.referral_code || null} />
          )}

          {/* Sponsorship Section */}
          {activeSection === "sponsorship" && (
            <SponsorshipCard userId={user!.id} />
          )}

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button variant="outline" className="h-14 text-sm" onClick={() => navigate("/jobs")}>
              🔍 Browse Jobs
            </Button>
            <Button variant="outline" className="h-14 text-sm" onClick={() => navigate("/services")}>
              📄 Our Services
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
