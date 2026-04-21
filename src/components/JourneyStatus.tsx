import { CheckCircle2, Circle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useNextStep, stepRoute, OnboardingStep } from "@/hooks/useNextStep";

interface StepDef {
  key: OnboardingStep;
  label: string;
  jobsOnly?: boolean;
  servicesOnly?: boolean;
}

const ALL_STEPS: StepDef[] = [
  { key: "path",             label: "Choose your goal" },
  { key: "profile",          label: "Complete your profile" },
  { key: "registration-pay", label: "Pay registration fee", jobsOnly: true },
  { key: "jobs",             label: "Pick up to 3 jobs", jobsOnly: true },
  { key: "services",         label: "Choose a service", servicesOnly: true },
  { key: "documents",        label: "Upload documents" },
  { key: "batch",            label: "Wait for travel batch", jobsOnly: true },
  { key: "sponsorship",      label: "Sponsorship decision", jobsOnly: true },
  { key: "ready",            label: "Ready to fly!" },
];

interface Props { chosenPath?: string | null; }

const JourneyStatus = ({ chosenPath }: Props) => {
  const { step, error } = useNextStep();
  const navigate = useNavigate();

  const isJobs = (chosenPath || "").toLowerCase() === "jobs";
  const visible = ALL_STEPS.filter(s => {
    if (s.jobsOnly) return isJobs;
    if (s.servicesOnly) return !isJobs;
    return true;
  });

  const currentIdx = visible.findIndex(s => s.key === step);
  const currentStep = visible.find(s => s.key === step);

  if (step === "loading") {
    return (
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 mb-6">
        <Loader2 className="animate-spin text-primary" size={18} />
        <span className="text-sm text-muted-foreground">Checking your progress…</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 to-safari-gold/10 border border-primary/20 rounded-xl p-4 sm:p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">Your Journey</h3>
        {currentStep && step !== "ready" && (
          <Button size="sm" onClick={() => navigate(stepRoute(step))} className="gap-1">
            Continue <ArrowRight size={14} />
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      <ol className="space-y-1.5">
        {visible.map((s, i) => {
          const done = currentIdx === -1 ? true : i < currentIdx || step === "ready";
          const active = currentIdx === i && step !== "ready";
          return (
            <li key={s.key} className="flex items-center gap-2 text-sm">
              {done ? (
                <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              ) : active ? (
                <div className="relative shrink-0">
                  <Circle size={18} className="text-primary" />
                  <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                </div>
              ) : (
                <Circle size={18} className="text-muted-foreground/40 shrink-0" />
              )}
              <span className={
                active ? "font-semibold text-foreground"
                : done ? "text-muted-foreground line-through"
                : "text-muted-foreground"
              }>
                {s.label}
              </span>
              {active && <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Next</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default JourneyStatus;
