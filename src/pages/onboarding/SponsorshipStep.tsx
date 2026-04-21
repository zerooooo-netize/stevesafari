import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import StepLayout from "@/components/onboarding/StepLayout";
import MpesaPay from "@/components/onboarding/MpesaPay";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { Home, Wallet, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SponsorshipStep = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { num, bool, loading: sLoading } = useSettings([
    "accommodation_fee", "sponsorship_self_proof_enabled",
  ]);
  const [mode, setMode] = useState<"agency" | "self_pay" | "self_proof" | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const fee = num("accommodation_fee", 15000);
  const selfProofEnabled = bool("sponsorship_self_proof_enabled", true);

  // If user has already submitted a sponsorship app, mark done
  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("sponsorship_applications").select("id, status").eq("user_id", user.id).limit(1);
      if (data && data.length > 0) setDone(true);
    })();
  }, [user?.id]);

  const submitAgencyPaid = async () => {
    // M-Pesa onSuccess records sponsorship row + advances
    if (!user) return;
    await supabase.from("sponsorship_applications").insert({
      user_id: user.id,
      reason: "Accommodation sponsorship via agency",
      requested_amount: fee,
      sponsor_mode: "agency",
      status: "fee_paid",
    });
    setDone(true);
    setTimeout(() => navigate("/onboarding/ready"), 800);
  };

  const submitSelfProof = async () => {
    if (!user || !proofFile) { toast.error("Please upload proof of funds"); return; }
    setSubmitting(true);
    const path = `${user.id}/proof-${Date.now()}-${proofFile.name}`;
    const { error: upErr } = await supabase.storage.from("accommodation-proofs").upload(path, proofFile);
    if (upErr) { setSubmitting(false); toast.error(upErr.message); return; }
    const { data: { publicUrl } } = supabase.storage.from("accommodation-proofs").getPublicUrl(path);
    const { error } = await supabase.from("sponsorship_applications").insert({
      user_id: user.id,
      reason: "Self-funded — proof uploaded for review",
      requested_amount: 0,
      sponsor_mode: "self",
      status: "pending_review",
      proof_file_url: publicUrl,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Submitted for review");
    setDone(true);
    setTimeout(() => navigate("/onboarding/ready"), 800);
  };

  if (sLoading) return <StepLayout stepNumber={6} totalSteps={7} title="Loading…">…</StepLayout>;
  if (done) return (
    <StepLayout stepNumber={6} totalSteps={7} title="Sponsorship recorded">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-900">
        <CheckCircle2 /> Recorded — heading to the final step…
      </div>
    </StepLayout>
  );

  return (
    <StepLayout
      stepNumber={6}
      totalSteps={7}
      title="Accommodation arrangement"
      subtitle="Choose how you'll cover accommodation when you arrive."
    >
      <div className="space-y-4">
        {/* Option 1 — Pay agency */}
        <button
          type="button"
          onClick={() => setMode("self_pay")}
          className={`w-full text-left p-4 rounded-xl border-2 transition ${mode === "self_pay" ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <div className="flex items-center gap-3">
            <Home className="text-primary" />
            <div className="flex-1">
              <p className="font-semibold">Pay accommodation fee via agency</p>
              <p className="text-xs text-muted-foreground">KES {fee.toLocaleString()} — we secure your housing</p>
            </div>
          </div>
        </button>

        {/* Option 2 — Self-fund with proof */}
        {selfProofEnabled && (
          <button
            type="button"
            onClick={() => setMode("self_proof")}
            className={`w-full text-left p-4 rounded-xl border-2 transition ${mode === "self_proof" ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <div className="flex items-center gap-3">
              <Wallet className="text-primary" />
              <div className="flex-1">
                <p className="font-semibold">I'll handle it myself</p>
                <p className="text-xs text-muted-foreground">Upload proof of funds for admin review</p>
              </div>
            </div>
          </button>
        )}

        {mode === "self_pay" && user && (
          <div className="border border-border rounded-xl p-4">
            <MpesaPay
              userId={user.id}
              amount={fee}
              paymentType="accommodation_fee"
              description="Accommodation sponsorship via agency"
              onSuccess={submitAgencyPaid}
            />
          </div>
        )}

        {mode === "self_proof" && (
          <div className="border border-border rounded-xl p-4 space-y-3">
            <label className="block">
              <div className="flex items-center justify-center gap-2 h-12 rounded-md border-2 border-dashed border-border cursor-pointer hover:bg-muted/40">
                <Upload size={16} />
                <span className="text-sm">{proofFile ? proofFile.name : "Upload proof of funds (PDF or image)"}</span>
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </label>
            <Button onClick={submitSelfProof} disabled={!proofFile || submitting} className="w-full">
              {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Submit for review
            </Button>
          </div>
        )}
      </div>
    </StepLayout>
  );
};

export default SponsorshipStep;
