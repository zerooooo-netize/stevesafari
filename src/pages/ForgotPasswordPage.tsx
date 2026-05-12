import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { name, logoUrl } = useBranding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Reset link sent. Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-safari-gold/5 flex items-center justify-center page-x section-y-sm">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition">
            <img src={logoUrl} alt={name} className="h-12 w-12" />
            <span className="font-heading text-h3 font-bold text-foreground">{name}</span>
          </Link>
          <h1 className="text-h1 text-foreground">Forgot password?</h1>
          <p className="text-body text-muted-foreground mt-2">
            Enter your email and we'll send you a link to reset it.
          </p>
        </div>

        {sent ? (
          <div className="bg-card border border-border rounded-2xl surface-pad-lg shadow-elevated text-center stack-sm">
            <div className="w-14 h-14 rounded-full bg-safari-gold/15 mx-auto flex items-center justify-center">
              <CheckCircle2 className="text-safari-gold" size={26} />
            </div>
            <h2 className="text-h3">Check your email</h2>
            <p className="text-body text-muted-foreground">
              We sent a reset link to <strong>{email}</strong>. The link expires in 1 hour.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl surface-pad-lg shadow-elevated stack-md"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-button flex items-center gap-1">
                <Mail size={14} /> Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11"
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <><Loader2 size={18} className="animate-spin mr-2" />Sending...</>
              ) : (
                "Send reset link"
              )}
            </Button>
            <Link
              to="/auth"
              className="text-button text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1 w-full"
            >
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
