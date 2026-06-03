import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import StepLayout from "@/components/onboarding/StepLayout";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { withRetry } from "@/lib/dbRetry";
import { useCurrency } from "@/contexts/CurrencyContext";

/** Services-path step 2 - pick one or more services in a single action. */
const ServicesStep = () => {
  const { format } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const [s, o] = await Promise.all([
      withRetry(async () => await supabase.from("services").select("*").eq("is_active", true).order("price")) as any,
      withRetry(async () => await supabase.from("service_orders").select("id, service_id, status").eq("user_id", user.id)) as any,
    ]);
    setServices(s.data || []);
    setOrders(o.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const orderAndContinue = async () => {
    if (!user) return;
    const ids = Array.from(selected);
    if (ids.length === 0) {
      // Already has orders → just continue
      if (orders.length > 0) { navigate("/onboarding/documents"); return; }
      toast.error("Pick at least one service");
      return;
    }
    setBusy(true);
    const rows = ids.map(sid => ({ user_id: user.id, service_id: sid, status: "pending" }));
    const { error } = await supabase.from("service_orders").insert(rows);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} service${ids.length > 1 ? "s" : ""} ordered. Pay from your dashboard.`);
    navigate("/onboarding/documents");
  };

  const total = services
    .filter(s => selected.has(s.id))
    .reduce((sum, s) => sum + Number(s.price || 0), 0);

  if (loading) return <StepLayout stepNumber={2} totalSteps={4} title="Loading…"><Loader2 className="animate-spin" /></StepLayout>;

  return (
    <StepLayout
      stepNumber={2}
      totalSteps={4}
      title="Pick the services you need"
      subtitle="Tap any service to add it. You can select multiple and pay together."
    >
      <div className="space-y-3">
        {services.map(s => {
          const ordered = orders.some(o => o.service_id === s.id);
          const isSelected = selected.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => !ordered && toggle(s.id)}
              disabled={ordered}
              className={`w-full text-left border rounded-xl p-4 transition flex items-center justify-between gap-3
                ${ordered ? "border-border opacity-70 cursor-default"
                  : isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50"}`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <ShoppingBag className="text-primary shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="font-semibold">{s.name}</p>
                  {s.description && <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                  <p className="text-sm font-medium text-primary mt-1">{format(Number(s.price), (s.currency as any) || "KES")}</p>
                </div>
              </div>
              {ordered ? (
                <span className="text-green-600 text-xs flex items-center gap-1 shrink-0"><CheckCircle2 size={14} />Ordered</span>
              ) : (
                <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                  {isSelected && <CheckCircle2 size={14} />}
                </span>
              )}
            </button>
          );
        })}

        {selected.size > 0 && (
          <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
            <span>{selected.size} selected</span>
            <strong>{format(total, "KES")}</strong>
          </div>
        )}

        <Button
          onClick={orderAndContinue}
          disabled={busy || (selected.size === 0 && orders.length === 0)}
          className="w-full mt-4"
        >
          {busy ? <><Loader2 size={14} className="animate-spin mr-2" />Adding…</>
            : selected.size > 0 ? `Add ${selected.size} & continue →`
            : "Continue to documents →"}
        </Button>
      </div>
    </StepLayout>
  );
};

export default ServicesStep;
