import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  applicationId: string;
  jobFee: number;
  onReady?: () => void;
}

/**
 * Pre-application checklist gate:
 * 1. Profile complete (full_name, phone, id_number)
 * 2. At least 1 document uploaded
 * 3. Payment (full or deposit) received for this application
 * Displays current state, locks "Submit" until all met.
 */
const PreApplicationChecklist = ({ userId, applicationId, jobFee, onReady }: Props) => {
  const [loading, setLoading] = useState(true);
  const [profileOk, setProfileOk] = useState(false);
  const [docsOk, setDocsOk] = useState(false);
  const [paymentOk, setPaymentOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appStatus, setAppStatus] = useState<string>("registered");

  const load = async () => {
    setLoading(true);
    const [profileRes, docsRes, paysRes, appRes] = await Promise.all([
      supabase.from("profiles").select("full_name, phone, id_number").eq("user_id", userId).maybeSingle(),
      supabase.from("documents").select("id").eq("user_id", userId).limit(1),
      supabase.from("payments")
        .select("amount, status, payment_type")
        .eq("user_id", userId).eq("application_id", applicationId).eq("status", "completed"),
      supabase.from("applications").select("status, checklist_completed").eq("id", applicationId).maybeSingle(),
    ]);
    const p = profileRes.data;
    setProfileOk(!!(p?.full_name && p.phone && p.id_number));
    setDocsOk((docsRes.data || []).length > 0);
    const totalPaid = (paysRes.data || []).reduce((s, r: any) => s + Number(r.amount || 0), 0);
    setPaymentOk(totalPaid > 0);
    setAppStatus(appRes.data?.status || "registered");
    setLoading(false);
  };

  useEffect(() => { if (userId && applicationId) load(); }, [userId, applicationId]);

  const allMet = profileOk && docsOk && paymentOk;

  const submit = async () => {
    if (!allMet) return;
    setSubmitting(true);
    await supabase.from("applications").update({
      checklist_completed: true,
      status: appStatus === "registered" ? "documents_submitted" : appStatus,
      submitted_at: new Date().toISOString(),
    }).eq("id", applicationId);
    setSubmitting(false);
    onReady?.();
    load();
  };

  if (loading) {
    return <div className="bg-muted/40 rounded-lg p-4 text-center text-xs text-muted-foreground">
      <Loader2 size={14} className="animate-spin inline mr-1" /> Checking requirements…
    </div>;
  }

  const items = [
    { ok: profileOk, label: "Profile complete (name, phone, ID number)", action: "Go to Profile tab" },
    { ok: docsOk, label: "At least 1 document uploaded", action: "Upload from Documents tab" },
    { ok: paymentOk, label: `Payment received (KES ${jobFee.toLocaleString()})`, action: "Pay via M-Pesa above" },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-card">
      <h4 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
        📋 Pre-application Checklist
      </h4>
      <ul className="space-y-2 mb-4">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            {it.ok ? (
              <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
            ) : (
              <Circle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={it.ok ? "line-through text-muted-foreground" : "text-foreground"}>{it.label}</p>
              {!it.ok && <p className="text-[11px] text-muted-foreground">{it.action}</p>}
            </div>
          </li>
        ))}
      </ul>

      {appStatus === "documents_submitted" || appStatus === "verified" || appStatus === "batch_assigned" || appStatus === "completed" ? (
        <div className="text-xs bg-green-50 text-green-800 rounded-md p-2 flex items-center gap-2">
          <CheckCircle2 size={14} /> Submitted — admin is processing your application.
        </div>
      ) : (
        <Button onClick={submit} disabled={!allMet || submitting} className="w-full text-sm">
          {!allMet && <Lock size={14} className="mr-1" />}
          {submitting ? "Submitting…" : allMet ? "Submit Application →" : "Complete checklist to submit"}
        </Button>
      )}
    </div>
  );
};

export default PreApplicationChecklist;
