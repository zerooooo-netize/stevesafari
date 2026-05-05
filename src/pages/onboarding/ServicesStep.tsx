import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import StepLayout from "@/components/onboarding/StepLayout";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { withRetry } from "@/lib/dbRetry";

/** Services-path step 2 - pick at least one service to order. */
const ServicesStep = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [s, o] = await Promise.all([
      withRetry(async () => await supabase.from("services").select("*").eq("is_active", true).order("price")) as any,
      withRetry(async () => await supabase.from("service_orders").select("id, service_id, status").eq("user_id", user.id)) as any,
    ]);
    setServices(s.data || []); setOrders(o.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  const order = async (sid: string) => {
    if (!user) return;
    setBusy(sid);
    const { error } = await supabase.from("service_orders").insert({
      user_id: user.id, service_id: sid, status: "pending",
    });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Service ordered. Pay from your dashboard.");
    load();
  };

  if (loading) return <StepLayout stepNumber={2} totalSteps={4} title="Loading…"><Loader2 className="animate-spin" /></StepLayout>;

  return (
    <StepLayout
      stepNumber={2}
      totalSteps={4}
      title="Pick the services you need"
      subtitle="Choose one or more. You'll pay (full or half) before submitting documents."
    >
      <div className="space-y-3">
        {services.map(s => {
          const ordered = orders.some(o => o.service_id === s.id);
          return (
            <div key={s.id} className="border border-border rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <ShoppingBag className="text-primary shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="font-semibold">{s.name}</p>
                  {s.description && <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                  <p className="text-sm font-medium text-primary mt-1">KES {Number(s.price).toLocaleString()}</p>
                </div>
              </div>
              {ordered ? (
                <span className="text-green-600 text-xs flex items-center gap-1 shrink-0"><CheckCircle2 size={14} /> Ordered</span>
              ) : (
                <Button size="sm" onClick={() => order(s.id)} disabled={busy === s.id}>
                  {busy === s.id ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} className="mr-1" /> Order</>}
                </Button>
              )}
            </div>
          );
        })}
        <Button onClick={() => navigate("/onboarding/documents")} disabled={orders.length === 0} className="w-full mt-4">
          Continue to Documents →
        </Button>
      </div>
    </StepLayout>
  );
};

export default ServicesStep;
