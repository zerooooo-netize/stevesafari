import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const refFromUrl = (searchParams.get("ref") || "").toUpperCase();
  const [isLogin, setIsLogin] = useState(!refFromUrl);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState(refFromUrl);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (refFromUrl) {
      setReferralCode(refFromUrl);
      setIsLogin(false);
    }
  }, [refFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        if (!fullName.trim()) { toast.error("Please enter your full name"); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, referred_by: referralCode || null } },
        });
        if (error) throw error;
        // Fire-and-forget welcome email (no await — don't block UX if SMTP not yet configured)
        supabase.functions.invoke("send-email", {
          body: { templateKey: "registration", to: email, data: { full_name: fullName } },
        }).catch(() => {});
        toast.success("Account created! Please check your email to verify.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img src={logo} alt="Steve Safari" className="h-12 w-12" />
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLogin ? "Sign in to your account" : "Join Steve Safari today"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 shadow-card space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Kamau" required />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          {!isLogin && (
            <div>
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <Input
                id="referralCode"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD34"
                maxLength={12}
              />
              {refFromUrl && (
                <p className="text-xs text-safari-gold mt-1">✓ You were referred by code {refFromUrl}</p>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-safari-gold font-medium hover:underline">
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
