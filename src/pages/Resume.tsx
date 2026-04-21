import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNextStep, stepRoute } from "@/hooks/useNextStep";
import { Loader2 } from "lucide-react";

/**
 * The smart "/" landing for logged-in users:
 * computes their next onboarding step and redirects there.
 */
const Resume = () => {
  const { user, isLoading } = useAuth();
  const { step, error } = useNextStep();

  if (isLoading || step === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm text-muted-foreground">Loading your journey…</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={stepRoute(step)} replace />;
};

export default Resume;
