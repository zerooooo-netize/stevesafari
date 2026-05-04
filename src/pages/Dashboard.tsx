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
  User,
  FileText,
  CreditCard,
  Upload,
  LogOut,
  Settings,
  Briefcase,
  ShoppingBag,
  Phone,
  Loader2,
  Gift,
  Shield,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
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

// ----------------------------------------------------------------------
// M‑Pesa Payment Widget — extracted but simplified visually
// ----------------------------------------------------------------------
interface MpesaPaymentWidgetProps {
  userId: string;
  applications?: any[];
  paymentType: string;
  fixedAmount?: number;
  serviceId?: string;
  onPaymentComplete: () => void;
}

const MpesaPaymentWidget = ({
  userId,
  applications = [],
  paymentType,
  fixedAmount,
  serviceId,
  onPaymentComplete,
}: MpesaPaymentWidgetProps) => {
  const [phone, setPhone] = useState("+254");
  const [amount, setAmount] = useState(fixedAmount ? String(fixedAmount) : "");
  const [selectedApp, setSelectedApp] = useState("");
  const [payMode, setPayMode] = useState<"full" | "deposit">("full");
  const [sending, setSending] = useState(false);
  const [pollId, setPollId] = useState<string | null>(null);
  const [payStatus, setPayStatus] = useState<string | null>(null);
  const [discount, setDiscount] = useState<{
    code: string | null;
    discountAmount: number;
    finalAmount: number;
    source: "manual" | "referral_auto" | null;
  }>({ code: null, discountAmount: 0, finalAmount: 0, source: null });

  const STK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mpesa-stk-push`;

  const selectedAppRow = applications.find((a) => a.id === selectedApp);
  const job = selectedAppRow?.jobs;
  const fullFee = Number(job?.application_fee || 0);
  const depositEnabled = !!job?.deposit_enabled;
  const depositValue = Number(job?.deposit_value || 0);
  const depositAmount =
    job?.deposit_type === "fixed"
      ? depositValue
      : Math.round((fullFee * depositValue) / 100);

  const applyJob = (id: string) => {
    setSelectedApp(id);
    const a = applications.find((x) => x.id === id);
    if (a?.jobs?.application_fee) {
      setAmount(String(a.jobs.application_fee));
      setPayMode("full");
    }
  };

  const setMode = (mode: "full" | "deposit") => {
    setPayMode(mode);
    if (mode === "deposit" && depositAmount > 0) {
      setAmount(String(depositAmount));
    } else if (mode === "full" && fullFee > 0) {
      setAmount(String(fullFee));
    }
  };

  const initiate = async () => {
    if (!phone || phone.length < 12) {
      toast.error("Enter a valid phone number (+254...)");
      return;
    }
    const finalAmountValue =
      discount.finalAmount > 0 ? discount.finalAmount : parseFloat(amount);
    if (!finalAmountValue || finalAmountValue <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const isDeposit = payMode === "deposit" && !!selectedApp;
    const balanceRemaining = isDeposit
      ? Math.max(fullFee - parseFloat(amount), 0)
      : 0;

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
          phone,
          amount: finalAmountValue,
          userId,
          applicationId: selectedApp || null,
          paymentType,
          isDeposit,
          balanceRemaining,
          serviceId: serviceId || null,
          description: `${paymentType.replace("_", "")} payment`,
          discountCode: discount.code,
          discountAmount: discount.discountAmount,
          finalAmount: finalAmountValue,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Payment failed");

      toast.success(data.message || "Check your phone for M-Pesa prompt!");
      setPollId(data.paymentId);
      setPayStatus("waiting");

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (attempts > 30) {
          clearInterval(interval);
          setPayStatus("timeout");
          setSending(false);
          return;
        }
        try {
          const statusResp = await fetch(
            `${STK_URL}?action=status&payment_id=${data.paymentId}`,
            {
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
            }
          );
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
        } catch {
          /* keep polling */
        }
      }, 5000);
    } catch (e: any) {
      toast.error(e.message);
      setPayStatus(null);
      setSending(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      {payStatus === "waiting" ? (
        <div className="text-center py-6">
          <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-3" />
          <p className="font-medium text-sm">Check your phone</p>
          <p className="text-xs text-gray-500 mt-1">
            Enter your M-Pesa PIN when prompted.
          </p>
        </div>
      ) : payStatus === "completed" ? (
        <div className="text-center py-6">
          <CheckCircle2 size={32} className="mx-auto text-green-600 mb-3" />
          <p className="font-medium text-sm text-green-700">Payment Successful</p>
          <p className="text-xs text-gray-500 mt-1">
            Receipt sent to your email.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => {
              setPayStatus(null);
              setAmount(fixedAmount ? String(fixedAmount) : "");
            }}
          >
            Make Another Payment
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {applications.length > 0 && !fixedAmount && (
              <div>
                <Label className="text-xs">Pay for which application?</Label>
                <select
                  value={selectedApp}
                  onChange={(e) => applyJob(e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white text-sm"
                >
                  <option value="">— Choose application —</option>
                  {applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.jobs?.title || "Application"} (KES{" "}
                      {Number(a.jobs?.application_fee || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedApp && depositEnabled && depositAmount > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("full")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${
                    payMode === "full"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  Pay Full (KES {fullFee.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => setMode("deposit")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${
                    payMode === "deposit"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  Deposit Only (KES {depositAmount.toLocaleString()})
                </button>
              </div>
            )}

            <div>
              <Label className="text-xs">Phone Number *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254712345678"
                className="text-sm"
              />
            </div>
            {!fixedAmount && (
              <div>
                <Label className="text-xs">Amount (KES) *</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  className="text-sm"
                />
              </div>
            )}
            {!selectedApp && !fixedAmount && (
              <div>
                <Label className="text-xs">Payment For</Label>
                <select
                  value={paymentType}
                  onChange={() => {}}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white text-sm"
                  disabled
                >
                  <option value={paymentType}>
                    {paymentType.replace("_", " ")}
                  </option>
                </select>
              </div>
            )}
          </div>

          {!fixedAmount && (
            <DiscountCodeInput
              userId={userId}
              baseAmount={parseFloat(amount) || 0}
              applyTo={
                paymentType === "service_payment" ? "service" : "application_fee"
              }
              onChange={setDiscount}
            />
          )}
          {discount.discountAmount > 0 && (
            <div className="text-xs text-gray-500 bg-gray-100 rounded p-2">
              Original: KES {(parseFloat(amount) || 0).toLocaleString()} |
              Discount: −KES {discount.discountAmount.toLocaleString()} |
              <strong>You pay: KES {discount.finalAmount.toLocaleString()}</strong>
            </div>
          )}
          <div className="text-xs text-gray-500 bg-gray-100 rounded p-2 flex items-start gap-1.5">
            <Shield size={12} className="text-blue-600 mt-0.5 shrink-0" />
            <span>Securely processed via M-Pesa. Official receipt provided.</span>
          </div>
          <Button
            onClick={initiate}
            disabled={sending}
            className="w-full text-sm bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1" />
                Processing...
              </>
            ) : (
              `Pay KES ${(discount.finalAmount > 0 ? discount.finalAmount : parseFloat(amount) || 0).toLocaleString()} with M-Pesa`
            )}
          </Button>
          {payStatus === "failed" && (
            <p className="text-xs text-red-600 text-center">
              Payment failed. Try again.
            </p>
          )}
          {payStatus === "timeout" && (
            <p className="text-xs text-yellow-600 text-center">
              Payment not confirmed. Check history.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// Simple progress indicator – just a row of check marks
// ----------------------------------------------------------------------
const SimpleProgress = ({
  steps,
}: {
  steps: { label: string; done: boolean; active?: boolean }[];
}) => {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
              step.done
                ? "bg-green-100 text-green-700"
                : step.active
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            {step.done ? <CheckCircle2 size={12} /> : idx + 1}
          </span>
          {idx < steps.length - 1 && (
            <span className="w-4 h-px bg-gray-300" />
          )}
        </div>
      ))}
      <span className="text-xs text-gray-500 ml-2">
        {steps.find((s) => s.active)?.label || ""}
      </span>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Dashboard Component — simplified, no gamification
// ----------------------------------------------------------------------
const Dashboard = () => {
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeServices, setActiveServices] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    id_number: "",
    passport_number: "",
    date_of_birth: "",
    nationality: "Kenyan",
  });
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("cv");
  const [showRegistrationPayment, setShowRegistrationPayment] = useState(false);
  const [selectedServiceForPayment, setSelectedServiceForPayment] =
    useState<any | null>(null);
  const [uploadedDocForService, setUploadedDocForService] =
    useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Settings from DB
  const {
    num: settingNum,
    str: settingStr,
    loading: settingsLoading,
  } = useSettings([
    "registration_fee",
    "registration_fee_required_for",
    "max_active_applications",
  ]);
  const REGISTRATION_FEE = settingNum("registration_fee", 0);
  const requiredFor = settingStr("registration_fee_required_for", "jobs")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const userPath = (profile?.chosen_path || "").toLowerCase();
  const needsRegistration =
    !!userPath && requiredFor.includes(userPath) && !profile?.registration_fee_paid;

  // Load all data on mount
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
    setLoadError(null);
    setDataLoading(true);
    try {
      const [appsRes, paysRes, docsRes, ordersRes, servicesRes] =
        await withRetry(() =>
          Promise.all([
            supabase
              .from("applications")
              .select(
                "*, jobs(title, country, salary, application_fee, deposit_enabled, deposit_type, deposit_value)"
              )
              .eq("user_id", user!.id),
            supabase
              .from("payments")
              .select("*")
              .eq("user_id", user!.id)
              .order("created_at", { ascending: false }),
            supabase
              .from("documents")
              .select("*")
              .eq("user_id", user!.id)
              .order("created_at", { ascending: false }),
            supabase
              .from("service_orders")
              .select("*, services(name, price, currency)")
              .eq("user_id", user!.id)
              .order("created_at", { ascending: false }),
            supabase
              .from("services")
              .select("id, name, price, currency")
              .eq("is_active", true)
              .order("name"),
          ])
        );
      setApplications(appsRes.data || []);
      setPayments(paysRes.data || []);
      setDocuments(docsRes.data || []);
      setServiceOrders(ordersRes.data || []);
      setActiveServices(servicesRes.data || []);
    } catch (e: any) {
      setLoadError(e?.message || "Could not load data. Tap Retry.");
    } finally {
      setDataLoading(false);
    }
  };

  const saveProfile = async () => {
    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("user_id", user!.id);
    if (error) {
      toast.error("Failed to update profile");
      return;
    }
    toast.success("Profile updated");
    setEditing(false);
    refreshProfile();
  };

  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from("user-documents")
      .upload(filePath, file);
    if (uploadErr) {
      toast.error("Upload failed: " + uploadErr.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("user-documents")
      .getPublicUrl(filePath);
    const { data: docData, error: insertErr } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        document_type: docType,
        file_url: urlData.publicUrl,
        file_name: file.name,
        application_id: applications.length > 0 ? applications[0].id : null,
      })
      .select()
      .single();
    if (insertErr) {
      toast.error(insertErr.message);
    } else {
      toast.success("Document uploaded!");
      setUploadedDocForService(docData);
      loadData();
    }
    setUploading(false);
  };

  // Determine simple progress steps
  const progressSteps = [
    {
      label: "Profile",
      done: !!(
        profile?.full_name &&
        profile.phone &&
        profile.id_number &&
        profile.registration_fee_paid
      ),
      active:
        !profile?.full_name || !profile.phone || !profile.id_number
          ? true
          : !profile?.registration_fee_paid,
    },
    {
      label: "Apply",
      done: applications.length > 0,
      active: applications.length === 0,
    },
    {
      label: "Documents",
      done: documents.length > 0,
      active: documents.length === 0 && applications.length > 0,
    },
    {
      label: "Payments",
      done: payments.some((p) => p.status === "completed"),
      active: applications.length > 0 && !payments.some((p) => p.status === "completed"),
    },
  ];

  // If registration fee is required, show that gate first
  if (needsRegistration) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="pt-20 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome
              </h1>
              <p className="text-gray-500 mt-2">
                Pay the one-time registration fee to unlock job applications.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h2 className="font-semibold text-lg mb-4">
                Registration Fee
              </h2>
              {settingsLoading ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  <Loader2 className="inline animate-spin mr-1" size={14} />
                  Loading fee…
                </div>
              ) : REGISTRATION_FEE <= 0 ? (
                <div className="bg-red-50 border border-red-100 rounded p-3 text-sm text-red-700">
                  Registration fee is not set. Please contact support.
                </div>
              ) : !showRegistrationPayment ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm mb-1">
                      One-time fee:{" "}
                      <span className="font-bold text-lg">
                        KES {REGISTRATION_FEE.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Covers agency processing and unlocks all job applications.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowRegistrationPayment(true)}
                    className="w-full"
                    size="lg"
                  >
                    Pay Registration Fee <ArrowRight size={16} className="ml-2" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate("/welcome")}
                  >
                    Switch to Document Services (no fee)
                  </Button>
                </div>
              ) : (
                <MpesaPaymentWidget
                  userId={user!.id}
                  paymentType="registration_fee"
                  fixedAmount={REGISTRATION_FEE}
                  onPaymentComplete={() => {
                    refreshProfile();
                    toast.success("Registration complete! You can now apply for jobs.");
                    setShowRegistrationPayment(false);
                  }}
                />
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Full dashboard — now the user has paid registration (or doesn't need it)
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {profile?.full_name || "Your Dashboard"}
              </h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate("/admin")}
                >
                  Admin
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={signOut}
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Retry banner */}
          {loadError && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">
                    Could not load all your data
                  </p>
                  <p className="text-xs text-gray-500">{loadError}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={loadData}
                disabled={dataLoading}
              >
                <RefreshCw
                  size={14}
                  className={`mr-1 ${dataLoading ? "animate-spin" : ""}`}
                />
                Retry
              </Button>
            </div>
          )}

          {/* Simple progress */}
          <SimpleProgress steps={progressSteps} />

          {/* ---- SECTION: Profile ---- */}
          <section className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
            <h2 className="font-semibold text-lg mb-4">Your Profile</h2>

            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone (+254...)</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="+254 7XX XXX XXX"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">ID Number</Label>
                  <Input
                    value={form.id_number}
                    onChange={(e) =>
                      setForm({ ...form, id_number: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Passport Number</Label>
                  <Input
                    value={form.passport_number}
                    onChange={(e) =>
                      setForm({ ...form, passport_number: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) =>
                      setForm({ ...form, date_of_birth: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nationality</Label>
                  <Input
                    value={form.nationality}
                    onChange={(e) =>
                      setForm({ ...form, nationality: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={saveProfile}
                  className="sm:col-span-2 text-sm"
                >
                  Save Profile
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-500 text-xs block">Name</span>
                  <span className="font-medium">
                    {profile?.full_name || "—"}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-500 text-xs block">Phone</span>
                  <span className="font-medium">{profile?.phone || "—"}</span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-500 text-xs block">ID Number</span>
                  <span className="font-medium">
                    {profile?.id_number || "—"}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-500 text-xs block">Passport</span>
                  <span className="font-medium">
                    {profile?.passport_number || "—"}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-500 text-xs block">
                    Date of Birth
                  </span>
                  <span className="font-medium">
                    {profile?.date_of_birth || "—"}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-500 text-xs block">Address</span>
                  <span className="font-medium">
                    {profile?.address || "—"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </Button>
              </div>
            )}
          </section>

          {/* ---- SECTION: Applications ---- */}
          <section className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
            <h2 className="font-semibold text-lg mb-4">Your Applications</h2>
            {applications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-3">
                  You have not applied for any jobs yet.
                </p>
                <Button size="sm" onClick={() => navigate("/jobs")}>
                  Browse Jobs
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">
                          {app.jobs?.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {app.jobs?.country} · {app.jobs?.salary}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          app.status === "rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </div>
                    {app.status === "registered" &&
                      app.jobs?.application_fee > 0 && (
                        <div className="mt-3">
                          <MpesaPaymentWidget
                            userId={user!.id}
                            applications={[app]}
                            paymentType="application_fee"
                            onPaymentComplete={loadData}
                          />
                        </div>
                      )}
                    {!["verified", "batch_assigned", "completed", "rejected"].includes(
                      app.status
                    ) && (
                      <div className="mt-3">
                        <PreApplicationChecklist
                          userId={user!.id}
                          applicationId={app.id}
                          jobFee={Number(app.jobs?.application_fee || 0)}
                          onReady={loadData}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ---- SECTION: Documents ---- */}
          <section className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
            <h2 className="font-semibold text-lg mb-4">Your Documents</h2>

            {/* Upload area */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 mb-4 bg-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="cv">CV / Resume</option>
                  <option value="passport">Passport Copy</option>
                  <option value="id_card">ID Card</option>
                  <option value="certificate">Certificate</option>
                  <option value="photo">Passport Photo</option>
                  <option value="other">Other</option>
                </select>
                <label className="flex-1 w-full">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-sm font-medium">
                    <Upload size={16} />
                    {uploading ? "Uploading..." : "Tap to Upload File"}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={uploadDocument}
                    disabled={uploading}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </label>
              </div>
            </div>

            {/* After upload, show available services (dynamic from DB) */}
            {uploadedDocForService &&
              !selectedServiceForPayment &&
              activeServices.length > 0 && (
                <div className="mb-4 p-4 border border-blue-200 bg-blue-50 rounded-xl">
                  <p className="text-sm font-medium mb-2">
                    Document uploaded! Need professional processing?
                  </p>
                  <div className="space-y-2">
                    {activeServices.map((s) => (
                      <Button
                        key={s.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedServiceForPayment(s)}
                      >
                        <FileText size={14} className="mr-2" />
                        {s.name} ({s.currency || "KES"}{" "}
                        {Number(s.price).toLocaleString()})
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setUploadedDocForService(null)}
                    >
                      Skip for now
                    </Button>
                  </div>
                </div>
              )}

            {selectedServiceForPayment && typeof selectedServiceForPayment === "object" && (
              <div className="mb-4">
                <MpesaPaymentWidget
                  userId={user!.id}
                  paymentType="service_payment"
                  serviceId={selectedServiceForPayment.id}
                  fixedAmount={Number(selectedServiceForPayment.price)}
                  onPaymentComplete={() => {
                    toast.success("Payment successful! Service order created.");
                    setSelectedServiceForPayment(null);
                    setUploadedDocForService(null);
                    loadData();
                  }}
                />
              </div>
            )}

            {/* Document list */}
            <h3 className="font-medium text-sm mt-6 mb-3">Uploaded Files</h3>
            {documents.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No documents uploaded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {doc.file_name || doc.document_type}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {doc.document_type.replace("_", " ")} · {doc.status}
                      </p>
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline shrink-0 ml-2"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ---- SECTION: Service Orders ---- */}
          <section className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
            <h2 className="font-semibold text-lg mb-4">Service Orders</h2>
            {serviceOrders.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-3">
                  No service orders yet.
                </p>
                <Button size="sm" onClick={() => navigate("/services")}>
                  Browse Services
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {serviceOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">
                          {(order.services as any)?.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {(order.services as any)?.currency}{" "}
                          {Number((order.services as any)?.price).toLocaleString()}
                        </p>
                        {order.details && (
                          <p className="text-xs text-gray-500 mt-1">
                            {order.details}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          order.status === "completed"
                            ? "bg-green-50 text-green-700"
                            : order.status === "rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    {order.completed_file_url && order.status === "completed" ? (
                      <a
                        href={order.completed_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Download Completed File
                      </a>
                    ) : order.completed_file_url &&
                      order.status !== "completed" ? (
                      <div className="text-xs text-gray-500 mt-2 bg-gray-100 rounded p-2">
                        File ready — complete payment to download.
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ---- SECTION: Payments ---- */}
          <section className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
            <h2 className="font-semibold text-lg mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No payments yet.
              </p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {p.currency} {Number(p.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {p.payment_type?.replace("_", " ")} ·{" "}
                        {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === "completed"
                          ? "bg-green-50 text-green-700"
                          : p.status === "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ---- SECTION: Refer & Earn ---- */}
          <section className="mb-8">
            <ReferralCard
              userId={user!.id}
              referralCode={profile?.referral_code || null}
            />
          </section>

          {/* ---- SECTION: Sponsorship ---- */}
          <section className="mb-8">
            <SponsorshipCard userId={user!.id} />
          </section>

          {/* Bottom navigation buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button
              variant="outline"
              className="h-14 text-sm"
              onClick={() => navigate("/jobs")}
            >
              Browse Jobs
            </Button>
            <Button
              variant="outline"
              className="h-14 text-sm"
              onClick={() => navigate("/services")}
            >
              Our Services
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
