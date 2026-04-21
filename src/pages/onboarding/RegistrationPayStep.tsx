import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import StepLayout from "@/components/onboarding/StepLayout";
import MpesaPay from "@/components/onboarding/MpesaPay";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Shield, Info } from "lucide-react";

const RegistrationPayStep = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { num, loading: sLoading } = useSettings(["registration_fee", "registration_deposit_percent"]);
  const [mode, setMode] = useState<"full" | "deposit">("full");

  useEffect(() => {
    // If already paid, skip
    if (profile?.registration_fee_paid) navigate("/onboarding/jobs", { replace: true });
  }, [profile, navigate]);

  const fullFee = num("registration_fee", 5000);
  const depositPct = num("registration_deposit_percent", 10);
  const depositFee = Math.max(1, Math.round((fullFee * depositPct) / 100));
  const amount = mode === "full" ? fullFee : depositFee;

  const onSuccess = async () => {
    await refreshProfile();
    navigate("/onboarding/jobs");
  };

  if (sLoading) return <StepLayout stepNumber={2} totalSteps={7} title="Loading…">…</StepLayout>;

  return (
    <StepLayout
      stepNumber={2}
      totalSteps={7}
      title="Pay your one-time registration fee"
      subtitle="This unlocks job applications. Pay in full or reserve your slot with a small deposit."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("full")}
            className={`p-4 rounded-lg border-2 text-left transition ${mode === "full" ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <div className="text-xs text-muted-foreground">Pay in full</div>
            <div className="font-bold text-lg">KES {fullFee.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Recommended</div>
          </button>
          <button
            type="button"
            onClick={() => setMode("deposit")}
            className={`p-4 rounded-lg border-2 text-left transition ${mode === "deposit" ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <div className="text-xs text-muted-foreground">Reserve slot ({depositPct}%)</div>
            <div className="font-bold text-lg">KES {depositFee.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Pay rest later</div>
          </button>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>You can apply for up to 3 jobs after this payment. The fee is non-refundable.</p>
        </div>

        {user && (
          <MpesaPay
            userId={user.id}
            amount={amount}
            paymentType="registration_fee"
            description={mode === "full" ? "Agency registration fee (full)" : `Agency registration deposit (${depositPct}%)`}
            onSuccess={onSuccess}
          />
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <Shield size={12} /> Secured by Kopo Kopo M-Pesa
        </div>
      </div>
    </StepLayout>
  );
};

export default RegistrationPayStep;
