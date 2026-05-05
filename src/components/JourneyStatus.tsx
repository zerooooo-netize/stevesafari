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
    <div className="relative bg-card border border-border rounded-2xl p-3.5 sm:p-6 mb-4 sm:mb-6 shadow-card overflow-hidden">
      {/* Decorative gradient blob - Canva style */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br from-safari-gold/20 to-primary/10 blur-2xl" />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-safari-gold mb-1">
            <Sparkles size={11} />
            <span className="truncate">{isJobs ? "Jobs Journey" : "Services Journey"}</span>
          </div>
          <h3 className="font-heading font-bold text-base sm:text-xl text-foreground leading-snug break-words">
            {step === "ready" ? "You're all set!" : currentStep ? `Next: ${currentStep.label}` : "Your Journey"}
          </h3>
          {currentStep && step !== "ready" && (
            <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 leading-snug">
              {currentStep.nextAction}
            </p>
          )}
        </div>
        {currentStep && step !== "ready" && (
          <Button
            size="sm"
            onClick={() => navigate(stepRoute(step))}
            className="gap-1 shrink-0 h-8 px-2.5 text-[11px] sm:h-9 sm:px-3 sm:text-sm rounded-full"
          >
            <span className="hidden xs:inline">Continue</span>
            <span className="xs:hidden">Go</span>
            <ArrowRight size={13} />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative mb-3 sm:mb-4">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground mb-1">
          <span>{completedCount}/{visible.length} complete</span>
          <span className="font-semibold text-foreground">{pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-safari-gold-light to-safari-gold transition-all duration-500 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {error && <p className="text-[11px] text-destructive mb-2">{error}</p>}

      {/* Step list */}
      <ol className="relative space-y-1">
        {visible.map((s, i) => {
          const done = currentIdx === -1 ? true : i < currentIdx || step === "ready";
          const active = currentIdx === i && step !== "ready";
          const Icon = s.Icon;
          return (
            <li
              key={s.key}
              className={`flex items-center gap-2.5 sm:gap-3 rounded-xl px-2 sm:px-2.5 py-1.5 sm:py-2 transition-colors ${
                active ? "bg-primary/5 ring-1 ring-primary/20" : ""
              }`}
            >
              <div className={`shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                done ? "bg-green-100 text-green-700"
                : active ? "bg-gradient-to-br from-primary to-safari-gold text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground"
              }`}>
                {done ? <CheckCircle2 size={14} /> : <Icon size={12} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[12px] sm:text-sm leading-tight truncate ${
                  active ? "font-semibold text-foreground"
                  : done ? "text-muted-foreground"
                  : "text-foreground/70"
                }`}>
                  {s.label}
                </p>
              </div>
              {active && (
                <span className="text-[9px] sm:text-[10px] font-bold bg-primary text-primary-foreground px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 tracking-wide">
                  NEXT
                </span>
              )}
              {done && (
                <span className="text-[9px] sm:text-[10px] font-semibold text-green-700 shrink-0">Done</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default JourneyStatus;
