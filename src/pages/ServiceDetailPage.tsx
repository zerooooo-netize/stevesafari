// ServiceDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustBar from "@/components/TrustBar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSEO } from "@/lib/seo";
import { toast } from "sonner";
import {
  ArrowLeft, FileText, Clock, ShieldCheck, CheckCircle2, AlertCircle,
  Loader2, Upload, Shield, Phone, X,
} from "lucide-react";

// M-Pesa Payment Widget for services
const MpesaPaymentWidget = ({
  userId,
  serviceId,
  amount,
  onPaymentComplete,
}: {
  userId: string;
  serviceId: string;
  amount: number;
  onPaymentComplete: (receiptNumber?: string) => void;
}) => {
  const [phone, setPhone] = useState("+254");
  const [sending, setSending] = useState(false);
  const [pollId, setPollId] = useState<string | null>(null);
  const [payStatus, setPayStatus] = useState<string | null>(null);

  const STK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mpesa-stk-push`;

  const initiate = async () => {
    if (!phone || phone.length < 12) {
      toast.error("Enter a valid phone number (+254...)");
      return;
    }
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
          amount,
          userId,
          paymentType: "service_payment",
          serviceId: serviceId,
          description: "Service order payment",
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
            toast.success(
              `Payment received! ✅ Receipt ${statusData.receipt_number || ""}`
            );
            onPaymentComplete(statusData.receipt_number);
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

  if (payStatus === "waiting") {
    return (
      <div className="text-center py-6">
        <Loader2 size={32} className="animate-spin mx-auto text-safari-gold mb-3" />
        <p className="font-medium text-sm">📱 Check your phone!</p>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your M-Pesa PIN when prompted.
        </p>
      </div>
    );
  }

  if (payStatus === "completed") {
    return (
      <div className="text-center py-6">
        <CheckCircle2 size={32} className="mx-auto text-green-600 mb-3" />
        <p className="font-medium text-sm text-green-700">Payment Successful!</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your order has been placed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Phone Number *</Label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+254712345678"
          className="text-sm"
        />
      </div>
      <div className="text-[11px] text-muted-foreground bg-muted/30 rounded p-2 flex items-start gap-1.5">
        <Shield size={12} className="text-safari-gold mt-0.5 shrink-0" />
        <span>
          Securely processed via M-Pesa (Kopo Kopo). Official receipt provided.
        </span>
      </div>
      <Button onClick={initiate} disabled={sending} className="w-full">
        {sending ? (
          <>
            <Loader2 size={14} className="animate-spin mr-1" /> Processing...
          </>
        ) : (
          `📱 Pay KES ${amount.toLocaleString()} with M-Pesa`
        )}
      </Button>
      {payStatus === "failed" && (
        <p className="text-xs text-destructive text-center">Payment failed. Try again.</p>
      )}
      {payStatus === "timeout" && (
        <p className="text-xs text-yellow-600 text-center">
          Payment not confirmed. Check history.
        </p>
      )}
    </div>
  );
};

const ServiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOrder, setShowOrder] = useState(false);
  const [orderStep, setOrderStep] = useState<"details" | "payment">("details");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payMode, setPayMode] = useState<"full" | "half">("full");

  useSEO({
    title: service ? `${service.name} | Steve Safari` : "Service | Steve Safari",
    description:
      service?.description?.slice(0, 155) ||
      "Professional document services for Kenyans applying abroad.",
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();
      setService(data);
      setLoading(false);
    })();
  }, [id]);

  const handleStart = () => {
    if (!user) {
      navigate(`/auth?redirect=/services/${id}`);
      return;
    }
    setShowOrder(true);
    setOrderStep("details");
    setDetails("");
    setFile(null);
    setPayMode("full");
  };

  const handlePaymentComplete = async (receiptNumber?: string) => {
    if (!user || !service) return;
    setSubmitting(true);

    // Upload file first (if any)
    let uploadedUrl: string | null = null;
    if (file) {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("service-files")
        .upload(path, file);
      if (upErr) {
        toast.error("File upload failed: " + upErr.message);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("service-files")
        .getPublicUrl(path);
      uploadedUrl = urlData.publicUrl;
    }

    // Create service order. status reflects payment progress: half_paid or paid.
    const fullPrice = Number(service.price || 0);
    const isHalf = payMode === "half";
    const { error } = await supabase.from("service_orders").insert({
      user_id: user.id,
      service_id: service.id,
      details: details.trim(),
      uploaded_file_url: uploadedUrl,
      status: isHalf ? "half_paid" : "paid",
      notes: isHalf ? `Half payment received. Balance KES ${Math.round(fullPrice / 2).toLocaleString()} due before delivery.` : null,
    });

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(isHalf ? "Half-payment received! Balance due before delivery." : "Order placed successfully! 🎉");
    setShowOrder(false);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="animate-spin text-safari-gold" size={28} />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container pt-24 pb-16 text-center">
          <p className="text-muted-foreground">Service not found.</p>
          <Link to="/services" className="text-safari-gold underline mt-4 inline-block">
            ← Back to services
          </Link>
        </main>
      </div>
    );
  }

  const price = Number(service.price || 0);
  const halfPrice = Math.round(price / 2);

  return (
    <div className="min-h-screen bg-background">
      <TrustBar />
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container max-w-3xl">
          <Link
            to="/services"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft size={14} /> All Services
          </Link>

          {/* Service Header */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-safari-gold/15 text-safari-gold grid place-items-center shrink-0">
                <FileText size={26} />
              </div>
              <div className="flex-1">
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {service.name}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Professional service handled by our experts.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-heading text-xl font-bold text-safari-gold">
                  {service.currency || "KES"} {price.toLocaleString()}
                </p>
              </div>
            </div>

            {service.description && (
              <p className="text-sm text-foreground/90 mt-5 pt-5 border-t border-border whitespace-pre-line leading-relaxed">
                {service.description}
              </p>
            )}
          </div>

          {/* What's included */}
          <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6">
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-safari-gold" /> What's included
            </h2>
            <ul className="space-y-2 text-sm">
              {[
                "Professional review by our specialists",
                "1 round of revisions included",
                "Delivery within 3–5 business days",
                "Final document delivered as PDF",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-green-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Pricing options */}
          <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6">
            <h2 className="font-heading font-bold text-lg mb-3">Payment options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayMode("full")}
                className={`text-left rounded-xl p-4 border transition-colors ${
                  payMode === "full"
                    ? "border-safari-gold bg-safari-gold/5 ring-2 ring-safari-gold/40"
                    : "border-border hover:border-safari-gold/50"
                }`}
              >
                <p className="text-xs text-muted-foreground">Full payment</p>
                <p className="font-heading text-xl font-bold mt-1">KES {price.toLocaleString()}</p>
                <p className="text-[11px] text-green-700 mt-1">✓ Get final file immediately on delivery</p>
              </button>
              <button
                type="button"
                onClick={() => setPayMode("half")}
                className={`text-left rounded-xl p-4 border transition-colors ${
                  payMode === "half"
                    ? "border-safari-gold bg-safari-gold/5 ring-2 ring-safari-gold/40"
                    : "border-border hover:border-safari-gold/50"
                }`}
              >
                <p className="text-xs text-muted-foreground">Half payment</p>
                <p className="font-heading text-xl font-bold mt-1">KES {halfPrice.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground mt-1">⏳ Final file unlocked after balance paid</p>
              </button>
            </div>
            <div className="flex items-start gap-2 mt-3 text-xs bg-muted/50 rounded p-2">
              <Clock size={12} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                Final document is locked until 100% payment is completed.
              </p>
            </div>
          </section>

          {/* Order Flow */}
          {!showOrder ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated">
              <Button size="lg" className="w-full" onClick={handleStart}>
                {user ? "Start Order" : "Sign In to Order"}
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-heading font-bold text-lg">
                  {orderStep === "details" ? "Tell us what you need" : "Complete Payment"}
                </h3>
                <button
                  onClick={() => setShowOrder(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X size={20} />
                </button>
              </div>

              {orderStep === "details" ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Details *</Label>
                    <Textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
                      placeholder="Describe your needs, target country, role, deadline, etc."
                      className="text-sm min-h-[120px]"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {details.length}/1000
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Upload existing file (optional)</Label>
                    <label className="flex items-center gap-2 border border-dashed border-border rounded-lg p-3 text-sm cursor-pointer hover:bg-muted/30">
                      <Upload size={16} className="text-muted-foreground" />
                      <span className="truncate flex-1">
                        {file?.name || "Choose file (max 10MB)"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowOrder(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        if (details.trim().length < 10) {
                          toast.error("Tell us more about what you need (min 10 chars)");
                          return;
                        }
                        setOrderStep("payment");
                      }}
                    >
                      Continue to Payment <ArrowLeft className="rotate-180 ml-1" size={14} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Order summary */}
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium">Order Summary</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {details || "No details provided"}
                    </p>
                    {file && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📎 {file.name}
                      </p>
                    )}
                    <p className="text-xs font-medium mt-2 pt-2 border-t border-border">
                      Total now: KES {(payMode === "half" ? halfPrice : price).toLocaleString()}
                      {payMode === "half" && (
                        <span className="block text-[10px] text-muted-foreground font-normal">Balance KES {halfPrice.toLocaleString()} due before delivery</span>
                      )}
                    </p>
                  </div>

                  <MpesaPaymentWidget
                    userId={user!.id}
                    serviceId={service.id}
                    amount={payMode === "half" ? halfPrice : price}
                    onPaymentComplete={handlePaymentComplete}
                  />

                  <button
                    onClick={() => setOrderStep("details")}
                    className="text-xs text-muted-foreground hover:underline w-full text-center"
                  >
                    ← Back to edit details
                  </button>

                  <p className="text-[11px] text-muted-foreground text-center">
                    You'll receive an official receipt via email after payment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Anti-scam */}
          <div className="mt-6 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <AlertCircle className="text-yellow-700 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-yellow-900">
              All payments happen <strong>only through this platform</strong> via M-Pesa. We will
              never ask for direct transfers.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceDetailPage;
