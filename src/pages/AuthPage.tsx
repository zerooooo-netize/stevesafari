// AuthPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Lock, 
  User, 
  Briefcase,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Award,
  Tag,
  Users
} from "lucide-react";
import logo from "@/assets/logo.png";

// Password strength checker
const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
  if (!pwd) return { score: 0, label: "Enter password", color: "text-muted-foreground" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  
  if (score <= 1) return { score: 1, label: "Weak", color: "text-red-500" };
  if (score === 2) return { score: 2, label: "Fair", color: "text-yellow-500" };
  if (score === 3) return { score: 3, label: "Good", color: "text-blue-500" };
  return { score: 4, label: "Strong", color: "text-green-500" };
};

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const refFromUrl = (searchParams.get("ref") || "").toUpperCase();
  // After auth, take user to "/" - Home auto-resumes them at their next onboarding step
  const redirectTo = searchParams.get("redirect") || "/";

  const [isLogin, setIsLogin] = useState(!refFromUrl);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState(refFromUrl);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = getPasswordStrength(password);

  useEffect(() => {
    // If user is already logged in, send to redirectTo (defaults to /welcome -> handles path choice)
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

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
        toast.success("Welcome back");
        navigate(redirectTo);
      } else {
        // Sign up validation
        if (!fullName.trim()) {
          toast.error("Please enter your full name");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              referred_by: referralCode || null,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        
        if (error) throw error;
        
        if (data.user?.identities?.length === 0) {
          toast.error("An account with this email already exists. Please sign in.");
          setIsLogin(true);
          setLoading(false);
          return;
        }
        
        // Send welcome email (fire-and-forget)
        supabase.functions.invoke("send-email", {
          body: { 
            templateKey: "registration", 
            to: email, 
            data: { full_name: fullName } 
          },
        }).catch(() => {});
        
        setEmailSent(true);
        toast.success("Account created. Check your email to verify");
        
        // After a few seconds, redirect to "/" smart resume
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setResendDisabled(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification email resent");
    }
    setTimeout(() => setResendDisabled(false), 60000); // 1 minute cooldown
  };

  // Email verification success message
  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center mb-4">
              <Mail className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h2 className="font-heading text-2xl font-bold mb-2">Verify Your Email</h2>
            <p className="text-muted-foreground mb-6">
              We have sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full" onClick={handleResendVerification} disabled={resendDisabled}>
                {resendDisabled ? "Wait 60 seconds" : "Resend Email"}
              </Button>
              <Button className="w-full" onClick={() => navigate("/")}>
                Continue
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Already verified? <button onClick={() => setIsLogin(true)} className="text-safari-gold hover:underline">Sign in</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-safari-gold/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition">
            <img src={logo} alt="Steve Safari" className="h-14 w-14" />
            <span className="font-heading text-xl font-bold text-foreground">Steve Safari</span>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            {isLogin ? "Welcome Back" : "Start Your Journey"}
            <Briefcase size={24} className="text-safari-gold" />
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isLogin 
              ? "Sign in to continue your job search adventure"
              : "Join our community and unlock global opportunities"}
          </p>
        </div>

        {/* Trust Bar */}
        <div className="flex items-center justify-center gap-6 mb-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-safari-gold" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={14} className="text-safari-gold" />
            <span>Trusted Agency</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={14} className="text-safari-gold" />
            <span>500+ Jobs Placed</span>
          </div>
        </div>

        {/* Main Form Card */}
        <form onSubmit={handleSubmit} className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-xl space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-1">
                <User size={14} />
                Full Name
              </Label>
              <Input 
                id="fullName" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="John Kamau" 
                className="h-11" 
                required 
                autoComplete="name"
              />
            </div>
          )}
          
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
              <Mail size={14} />
              Email
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

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium flex items-center gap-1">
              <Lock size={14} />
              Password
            </Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder={isLogin ? "Enter your password" : "Create a strong password"} 
                className="h-11 pr-10" 
                required 
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!isLogin && password && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.score === 1 ? "bg-red-500 w-1/4" :
                      passwordStrength.score === 2 ? "bg-yellow-500 w-2/4" :
                      passwordStrength.score === 3 ? "bg-blue-500 w-3/4" :
                      "bg-green-500 w-full"
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="referralCode" className="text-sm font-medium flex items-center gap-1">
                <Tag size={14} />
                Referral Code (Optional)
              </Label>
              <Input
                id="referralCode" 
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD34" 
                maxLength={12}
                className="h-11 uppercase"
              />
              {refFromUrl && (
                <p className="text-xs text-safari-gold flex items-center gap-1 mt-1">
                  <CheckCircle2 size={12} />
                  You were referred by code {refFromUrl}
                </p>
              )}
            </div>
          )}

          {isLogin && (
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-safari-gold hover:underline">
                Forgot password
              </Link>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium" 
            disabled={loading
          }>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Please wait...
              </>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>

          {/* Terms & Privacy */}
          {!isLogin && (
            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link to="/terms" className="text-safari-gold hover:underline">Terms</Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-safari-gold hover:underline">Privacy Policy</Link>.
            </p>
          )}
        </form>

        {/* Toggle between Login/Signup */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "New to Steve Safari? " : "Already have an account? "}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setEmailSent(false);
            }} 
            className="text-safari-gold font-semibold hover:underline transition"
          >
            {isLogin ? "Join now" : "Sign in"}
          </button>
        </p>

        {/* Professional note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/70">
            Trusted by thousands of Kenyans working abroad
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
