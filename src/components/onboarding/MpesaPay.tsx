import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId: string;
  amount: number;
  paymentType: string;
  description: string;
  applicationId?: string;
  serviceOrderId?: string;
  onSuccess: () => void;
}

/**
 * Lean reusable M-Pesa STK widget for onboarding pages.
 * Polls payment status every 3s for up to 90s.
 */
const MpesaPay = ({ userId, amount, paymentType, description, applicationId, serviceOrderId, onSuccess }: Props) => {
  const [phone, setPhone] = useState("+254");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "polling" | "completed" | "failed">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const STK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mpesa-stk-push`;

  const pay = async () => {
    if (!/^\+254[17]\d{8}$/.test(phone)) {
      toast.error("Enter valid phone like +254712345678");
      return;
    }
    setBusy(true); setErrorMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(STK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          userId, phone, amount, paymentType, description,
          applicationId, serviceOrderId,
        }),
      });
      const j = await resp.json();
      if (!resp.ok || !j?.paymentId) {
        throw new Error(j?.error || "Failed to start payment");
      }
      setStatus("sent");
      toast.success("Check your phone for the M-Pesa prompt");
      // Poll
      const pid = j.paymentId;
      let tries = 0;
      const interval = setInterval(async () => {
        tries++;
        const r = await fetch(`${STK_URL}?action=status&payment_id=${pid}`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const s = await r.json();
        if (s?.status === "completed") {
          clearInterval(interval);
          setStatus("completed");
          toast.success("Payment received!");
          setTimeout(onSuccess, 1200);
        } else if (s?.status === "failed" || tries > 30) {
          clearInterval(interval);
          setStatus("failed");
          toast.error("Payment did not complete. Try again.");
        }
      }, 3000);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Payment failed");
      toast.error(e.message || "Payment failed");
      setStatus("failed");
    } finally {
      setBusy(false);
    }
  };

  if (status === "completed") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-900 flex items-center gap-2">
        <CheckCircle2 size={20} /> Payment received - taking you to next step…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-muted/50 rounded-lg p-3 text-sm">
        <div className="flex justify-between"><span>Amount</span><strong>KES {amount.toLocaleString()}</strong></div>
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      </div>
      <div>
        <Label htmlFor="phone">M-Pesa Phone</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254712345678" />
      </div>
      {errorMsg && (
        <div className="bg-destructive/10 text-destructive text-xs rounded p-2 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> {errorMsg}
        </div>
      )}
      <Button onClick={pay} disabled={busy || status === "sent"} className="w-full">
        {busy && <Loader2 size={16} className="mr-2 animate-spin" />}
        {status === "sent" ? "Waiting for M-Pesa prompt…" : `Pay KES ${amount.toLocaleString()} via M-Pesa`}
      </Button>
    </div>
  );
};

export default MpesaPay;
