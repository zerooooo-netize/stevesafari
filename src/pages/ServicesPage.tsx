import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { FileText, Stamp, Globe, FileCheck, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, any> = { "file-text": FileText, "file-check": FileCheck, "stamp": Stamp, "globe": Globe };

const ServicesPage = () => {
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("services").select("*").eq("is_active", true).order("created_at");
    setServices(data || []);
    setLoading(false);
  };

  const orderService = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!selectedService) return;
    if (!details.trim() && !file) {
      toast.error("Please describe what you need or upload a file");
      return;
    }
    setSubmitting(true);
    try {
      let uploadedUrl: string | null = null;
      if (file) {
        if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); setSubmitting(false); return; }
        const path = `${user.id}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from("service-files").upload(path, file);
        if (upErr) { toast.error("Upload failed: " + upErr.message); setSubmitting(false); return; }
        const { data: urlData } = supabase.storage.from("service-files").createSignedUrl
          ? await supabase.storage.from("service-files").createSignedUrl(path, 60 * 60 * 24 * 365)
          : { data: { signedUrl: "" } } as any;
        uploadedUrl = urlData?.signedUrl || path;
      }
      const { error } = await supabase.from("service_orders").insert({
        user_id: user.id,
        service_id: selectedService.id,
        details,
        uploaded_file_url: uploadedUrl,
      });
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      toast.success(`Order placed! 💳 Pay KES ${Number(selectedService.price).toLocaleString()} from your dashboard.`);
      setSelectedService(null);
      setDetails("");
      setFile(null);
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">📄 Document Services</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Professional document preparation. Tap a service to order!</p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No services available right now.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {services.map((service, i) => {
                const Icon = iconMap[service.icon] || FileText;
                return (
                  <motion.div
                    key={service.id}
                    className="bg-card rounded-xl border border-border p-4 sm:p-6 text-center shadow-card hover:shadow-elevated transition-all hover:-translate-y-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-safari-gold/10 text-safari-gold mb-4">
                      <Icon size={24} />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-sm sm:text-base">{service.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2 mb-4">{service.description}</p>
                    <div className="font-heading font-bold text-safari-gold text-lg mb-4">{service.currency} {Number(service.price).toLocaleString()}</div>
                    <Button variant="outline" size="sm" className="w-full h-10" onClick={() => setSelectedService(service)}>
                      🛒 Order Now <ArrowRight size={14} />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Order Modal */}
          {selectedService && (
            <div className="fixed inset-0 bg-foreground/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
              <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border p-5 sm:p-6 w-full sm:max-w-md shadow-elevated max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-heading font-semibold text-lg">🛒 Order: {selectedService.name}</h3>
                  <button onClick={() => setSelectedService(null)} className="p-1 hover:bg-muted rounded"><X size={20} /></button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">💰 Price: <span className="font-semibold text-safari-gold">{selectedService.currency} {Number(selectedService.price).toLocaleString()}</span></p>

                <Label className="text-xs">Details / What you need</Label>
                <Textarea value={details} onChange={e => setDetails(e.target.value)} rows={3} placeholder="e.g. Update my CV for warehouse jobs in Toronto" className="mb-3 text-sm" />

                <Label className="text-xs">Attach file (optional, max 10MB)</Label>
                <input
                  type="file"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="block w-full text-sm mb-4 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-safari-gold/10 file:text-safari-gold file:font-medium"
                />

                <p className="text-xs text-muted-foreground mb-3">After submitting, pay from your dashboard to start work.</p>
                <div className="flex gap-2">
                  <Button onClick={orderService} disabled={submitting} className="flex-1 h-11">
                    {submitting ? "Submitting..." : "✅ Submit Order"}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedService(null)} className="h-11">Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServicesPage;
