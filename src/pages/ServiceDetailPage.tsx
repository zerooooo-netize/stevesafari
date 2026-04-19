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
import { useSEO } from "@/lib/seo";
import { toast } from "sonner";
import {
  ArrowLeft, FileText, Clock, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Upload,
} from "lucide-react";

const ServiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOrder, setShowOrder] = useState(false);
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useSEO({
    title: service ? `${service.name} | Steve Safari` : "Service | Steve Safari",
    description: service?.description?.slice(0, 155) || "Professional document services for Kenyans applying abroad.",
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("services").select("*").eq("id", id).eq("is_active", true).maybeSingle();
      setService(data);
      setLoading(false);
    })();
  }, [id]);

  const handleStart = () => {
    if (!user) { navigate(`/auth?redirect=/services/${id}`); return; }
    setShowOrder(true);
  };

  const submitOrder = async () => {
    if (!user || !service) return;
    if (details.trim().length < 10) { toast.error("Tell us more about what you need (min 10 chars)"); return; }
    setSubmitting(true);
    let uploadedUrl: string | null = null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); setSubmitting(false); return; }
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("service-files").upload(path, file);
      if (upErr) { toast.error(upErr.message); setSubmitting(false); return; }
      const { data: signed } = await supabase.storage.from("service-files").createSignedUrl(path, 60 * 60 * 24 * 30);
      uploadedUrl = signed?.signedUrl || null;
    }
    const { error } = await supabase.from("service_orders").insert({
      user_id: user.id, service_id: service.id, details: details.trim(),
      uploaded_file_url: uploadedUrl, status: "pending",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Order placed! Pay from your dashboard to start work.");
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
          <Link to="/services" className="text-safari-gold underline mt-4 inline-block">← Back to services</Link>
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
          <Link to="/services" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft size={14} /> All Services
          </Link>

          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-safari-gold/15 text-safari-gold grid place-items-center shrink-0">
                <FileText size={26} />
              </div>
              <div className="flex-1">
                <h1 className="font-heading text-2xl font-bold text-foreground">{service.name}</h1>
                <p className="text-muted-foreground text-sm mt-1">Professional service handled by our experts.</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-heading text-xl font-bold text-safari-gold">{service.currency || "KES"} {price.toLocaleString()}</p>
              </div>
            </div>

            {service.description && (
              <p className="text-sm text-foreground/90 mt-5 pt-5 border-t border-border whitespace-pre-line leading-relaxed">{service.description}</p>
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
              <div className="border border-safari-gold rounded-xl p-4 bg-safari-gold/5">
                <p className="text-xs text-muted-foreground">Full payment</p>
                <p className="font-heading text-xl font-bold mt-1">KES {price.toLocaleString()}</p>
                <p className="text-[11px] text-green-700 mt-1">✓ Get final file immediately on delivery</p>
              </div>
              <div className="border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Half payment</p>
                <p className="font-heading text-xl font-bold mt-1">KES {halfPrice.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground mt-1">⏳ Final file unlocked after balance paid</p>
              </div>
            </div>
            <div className="flex items-start gap-2 mt-3 text-xs bg-muted/50 rounded p-2">
              <Clock size={12} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-muted-foreground">Final document is locked until 100% payment is completed.</p>
            </div>
          </section>

          {/* CTA */}
          {!showOrder ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated">
              <Button size="lg" className="w-full" onClick={handleStart}>
                {user ? "Start Order" : "Sign In to Order"}
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated">
              <h3 className="font-heading font-bold text-lg mb-3">Tell us what you need</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Details *</Label>
                  <Textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
                    placeholder="Describe your needs, target country, role, deadline, etc."
                    className="text-sm min-h-[120px]"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">{details.length}/1000</p>
                </div>
                <div>
                  <Label className="text-xs">Upload existing file (optional)</Label>
                  <label className="flex items-center gap-2 border border-dashed border-border rounded-lg p-3 text-sm cursor-pointer hover:bg-muted/30">
                    <Upload size={16} className="text-muted-foreground" />
                    <span className="truncate flex-1">{file?.name || "Choose file (max 10MB)"}</span>
                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowOrder(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={submitOrder} disabled={submitting}>
                    {submitting ? <><Loader2 size={14} className="animate-spin mr-1" /> Submitting…</> : "Place Order"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground text-center">You'll pay via M-Pesa from your dashboard right after.</p>
              </div>
            </div>
          )}

          {/* Anti-scam */}
          <div className="mt-6 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <AlertCircle className="text-yellow-700 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-yellow-900">
              All payments happen <strong>only through this platform</strong> via M-Pesa. We will never ask for direct transfers.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceDetailPage;
