import { useEffect, useState } from "react";
import {
  CheckCircle2, Circle, ArrowRight, Loader2,
  UserCircle2, CreditCard, Briefcase, FileText,
  Plane, HandCoins, PartyPopper, Sparkles, Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useNextStep, stepRoute, OnboardingStep } from "@/hooks/useNextStep";
import { useSettings } from "@/hooks/useSettings";

interface StepDef {
  key: OnboardingStep;
  label: string;
  nextAction: string;
  Icon: typeof Compass;
}

const STEP_LIBRARY: Record<Exclude<OnboardingStep, "loading">, StepDef> = {
  path:               { key: "path",               label: "Choose your goal",       nextAction: "Pick the path that fits you",       Icon: Compass },
  profile:            { key: "profile",            label: "Complete your profile",  nextAction: "Add your name, phone & ID",          Icon: UserCircle2 },
  "registration-pay": { key: "registration-pay",   label: "Pay registration fee",   nextAction: "Pay the one-time registration fee",  Icon: CreditCard },
  jobs:               { key: "jobs",               label: "Pick up to 3 jobs",      nextAction: "Select the jobs you want to apply for", Icon: Briefcase },
  services:           { key: "services",           label: "Choose a service",       nextAction: "Pick the service you need",          Icon: Sparkles },
  documents:          { key: "documents",          label: "Upload documents",       nextAction: "Upload the required documents",      Icon: FileText },
  batch:              { key: "batch",              label: "Wait for travel batch",  nextAction: "Sit tight while admin assigns you a batch", Icon: Plane },
  sponsorship:        { key: "sponsorship",        label: "Sponsorship decision",   nextAction: "Choose how you'll fund accommodation", Icon: HandCoins },
  ready:              { key: "ready",              label: "Ready to fly!",          nextAction: "All done - final briefing coming",  Icon: PartyPopper },
};

const DEFAULT_JOBS = ["path","profile","registration-pay","jobs","documents","batch","sponsorship","ready"];
const DEFAULT_SERVICES = ["path","profile","services","documents","ready"];

interface Props { chosenPath?: string | null; }

const JourneyStatus = ({ chosenPath }: Props) => {
  const { step, error } = useNextStep();
  const { settings, loading: sLoading } = useSettings(["onboarding_steps_jobs", "onboarding_steps_services"]);
  const navigate = useNavigate();

  const isJobs = (chosenPath || "").toLowerCase() === "jobs";
  const raw = isJobs
    ? (settings.onboarding_steps_jobs || DEFAULT_JOBS.join(","))
    : (settings.onboarding_steps_services || DEFAULT_SERVICES.join(","));

  const enabledKeys = raw.split(",").map(s => s.trim()).filter(Boolean) as OnboardingStep[];
  const visible = enabledKeys
    .map(k => STEP_LIBRARY[k as Exclude<OnboardingStep, "loading">])
    .filter(Boolean);

  const currentIdx = visible.findIndex(s => s.key === step);
  const currentStep = currentIdx >= 0 ? visible[currentIdx] : null;
  const completedCount = currentIdx === -1 ? visible.length : currentIdx;
  const pct = visible.length ? Math.round((completedCount / visible.length) * 100) : 0;

  if (step === "loading" || sLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 mb-6">
        <Loader2 className="animate-spin text-primary" size={18} />
        <span className="text-sm text-muted-foreground">Checking your progress…</span>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-6 shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
            <Sparkles size={12} className="text-safari-gold" />
            <span>{isJobs ? "Jobs Journey" : "Services Journey"}</span>
          </div>
          <h3 className="font-heading font-bold text-lg sm:text-xl text-foreground leading-tight">
            {step === "ready" ? "You're all set!" : currentStep ? `Next: ${currentStep.label}` : "Your Journey"}
          </h3>
          {currentStep && step !== "ready" && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{currentStep.nextAction}</p>
          )}
        </div>
        {currentStep && step !== "ready" && (
          <Button size="sm" onClick={() => navigate(stepRoute(step))} className="gap-1 shrink-0">
            Continue <ArrowRight size={14} />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>{completedCount} of {visible.length} complete</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-safari-gold transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      {/* Step list */}
      <ol className="space-y-1.5">
        {visible.map((s, i) => {
          const done = currentIdx === -1 ? true : i < currentIdx || step === "ready";
          const active = currentIdx === i && step !== "ready";
          const Icon = s.Icon;
          return (
            <li
              key={s.key}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                active ? "bg-primary/5 border border-primary/20" : ""
              }`}
            >
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                done ? "bg-green-100 text-green-700"
                : active ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
              }`}>
                {done ? <CheckCircle2 size={16} /> : <Icon size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm leading-tight ${
                  active ? "font-semibold text-foreground"
                  : done ? "text-muted-foreground"
                  : "text-foreground/70"
                }`}>
                  {s.label}
                </p>
                {active && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.nextAction}</p>
                )}
              </div>
              {active && (
                <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full shrink-0">
                  NEXT
                </span>
              )}
              {done && (
                <span className="text-[10px] font-medium text-green-700 shrink-0">Done</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default JourneyStatus;
