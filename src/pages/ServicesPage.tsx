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
import { FileText, Stamp, Globe, FileCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, any> = { "file-text": FileText, "file-check": FileCheck, "stamp": Stamp, "globe": Globe };

const ServicesPage = () => {
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [details, setDetails] = useState("");
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
    const { error } = await supabase.from("service_orders").insert({
      user_id: user.id,
      service_id: selectedService.id,
      details,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Service ordered! Check your dashboard for updates.");
    setSelectedService(null);
    setDetails("");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Document Services</h1>
            <p className="text-muted-foreground mt-2">Professional document preparation and processing.</p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, i) => {
                const Icon = iconMap[service.icon] || FileText;
                return (
                  <motion.div
                    key={service.id}
                    className="bg-card rounded-lg border border-border p-6 text-center shadow-card hover:shadow-elevated transition-all hover:-translate-y-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-safari-gold/10 text-safari-gold mb-4">
                      <Icon size={24} />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2 mb-4">{service.description}</p>
                    <div className="font-heading font-bold text-safari-gold text-lg mb-4">{service.currency} {Number(service.price).toLocaleString()}</div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedService(service)}>
                      Order Now <ArrowRight size={14} />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Order Modal */}
          {selectedService && (
            <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full shadow-elevated">
                <h3 className="font-heading font-semibold text-lg mb-2">Order: {selectedService.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">Price: {selectedService.currency} {Number(selectedService.price).toLocaleString()}</p>
                <Label>Details / Instructions</Label>
                <Textarea value={details} onChange={e => setDetails(e.target.value)} rows={4} placeholder="Describe what you need..." className="mb-4" />
                <div className="flex gap-2">
                  <Button onClick={orderService} className="flex-1">Submit Order</Button>
                  <Button variant="outline" onClick={() => setSelectedService(null)}>Cancel</Button>
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
