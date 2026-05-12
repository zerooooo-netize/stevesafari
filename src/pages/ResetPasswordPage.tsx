import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { name, logoUrl } = useBranding();

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when user lands from email link
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also check existing session in case event already fired
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-safari-gold/5 flex items-center justify-center page-x section-y-sm">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src={logoUrl} alt={name} className="h-12 w-12" />
            <span className="font-heading text-h3 font-bold text-foreground">{name}</span>
          </div>
          <h1 className="text-h1 text-foreground">Set a new password</h1>
          <p className="text-body text-muted-foreground mt-2">
            Choose a strong password you haven't used before.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl surface-pad-lg shadow-elevated stack-md"
        >
          {!ready && (
            <p className="text-caption text-muted-foreground text-center">
              Verifying reset link...
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-button flex items-center gap-1">
              <Lock size={14} /> New password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pr-10"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-button flex items-center gap-1">
              <Lock size={14} /> Confirm password
            </Label>
            <Input
              id="confirm"
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading || !ready}>
            {loading ? (
              <><Loader2 size={18} className="animate-spin mr-2" />Updating...</>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
