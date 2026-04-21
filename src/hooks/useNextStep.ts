import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { withRetry } from "@/lib/dbRetry";

/**
 * Derives the user's current onboarding step from DB state.
 * Linear flow for the "jobs" path:
 *   path  → profile → registration-pay → jobs → documents → batch → sponsorship → ready
 * Services-only path skips registration-pay/jobs/batch/sponsorship and goes
 *   path  → profile → services → documents → ready
 */
export type OnboardingStep =
  | "path"
  | "profile"
  | "registration-pay"
  | "jobs"
  | "services"
  | "documents"
  | "batch"
  | "sponsorship"
  | "ready"
  | "loading";

export const stepRoute = (s: OnboardingStep): string => {
  switch (s) {
    case "path": return "/welcome";
    case "profile": return "/onboarding/profile";
    case "registration-pay": return "/onboarding/registration-pay";
    case "jobs": return "/onboarding/jobs";
    case "services": return "/onboarding/services";
    case "documents": return "/onboarding/documents";
    case "batch": return "/onboarding/batch";
    case "sponsorship": return "/onboarding/sponsorship";
    case "ready": return "/onboarding/ready";
    default: return "/dashboard";
  }
};

export const useNextStep = () => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("loading");
  const [error, setError] = useState<string | null>(null);

  const compute = async () => {
    if (!user) { setStep("loading"); return; }
    setError(null);
    try {
      // 1. Path gate
      if (!profile?.chosen_path) { setStep("path"); return; }

      // 2. Profile completeness (full_name, phone, id_number)
      const profileComplete = !!(profile?.full_name && profile?.phone && profile?.id_number);
      if (!profileComplete) { setStep("profile"); return; }

      const isJobsPath = profile.chosen_path === "jobs";

      if (!isJobsPath) {
        // Services-only path
        const { data: orders } = await withRetry(async () => await supabase
          .from("service_orders").select("id, status").eq("user_id", user.id)) as any;
        if (!orders || orders.length === 0) { setStep("services"); return; }
        const allDone = orders.every((o: any) => o.status === "completed");
        setStep(allDone ? "ready" : "documents");
        return;
      }

      // === Jobs path ===
      // 3. Registration fee
      if (!profile?.registration_fee_paid) { setStep("registration-pay"); return; }

      // 4. Active applications
      const { data: apps } = await withRetry(async () => await supabase
        .from("applications")
        .select("id, status, batch_ready, checklist_completed")
        .eq("user_id", user.id)) as any;
      if (!apps || apps.length === 0) { setStep("jobs"); return; }

      // 5. Documents — at least one doc uploaded
      const { data: docs } = await withRetry(async () => await supabase
        .from("documents").select("id").eq("user_id", user.id).limit(1)) as any;
      if (!docs || docs.length === 0) { setStep("documents"); return; }

      // 6. Batch assigned?
      const anyBatchReady = apps.some((a: any) => a.batch_ready);
      if (!anyBatchReady) { setStep("batch"); return; }

      // 7. Sponsorship decision made?
      const { data: sponsorships } = await withRetry(async () => await supabase
        .from("sponsorship_applications").select("id, status, sponsor_mode").eq("user_id", user.id)) as any;
      const hasSponsorship = sponsorships && sponsorships.length > 0;
      if (!hasSponsorship) { setStep("sponsorship"); return; }

      setStep("ready");
    } catch (e: any) {
      console.error("useNextStep error:", e);
      setError(e?.message || "Failed to compute next step");
      setStep("loading");
    }
  };

  useEffect(() => { compute(); /* eslint-disable-next-line */ }, [user?.id, profile?.chosen_path, profile?.registration_fee_paid, profile?.full_name, profile?.phone, profile?.id_number]);

  return { step, error, refresh: compute };
};
