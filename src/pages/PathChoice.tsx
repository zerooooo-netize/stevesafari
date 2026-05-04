import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, ArrowRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const PathChoice = () =>{
 const { user, profile, refreshProfile, signOut } = useAuth();
 const navigate = useNavigate();
 const [loading, setLoading] = useState<string | null>(null);
 const [gateEnabled, setGateEnabled] = useState(true);
 const [checking, setChecking] = useState(true);

 useEffect(() =>{
 const check = async () =>{
 const { data } = await supabase
 .from("settings").select("value").eq("key", "path_gate_enabled").maybeSingle();
 const enabled = data?.value !== "false";
 setGateEnabled(enabled);
 // Already chose, or gate disabled → straight to dashboard
 if (!enabled || profile?.chosen_path) {
 navigate("/dashboard", { replace: true });
 return;
 }
 setChecking(false);
 };
 if (user) check(); else setChecking(false);
 }, [user, profile, navigate]);

 const choose = async (path: "jobs"| "services") =>{
 if (!user) return;
 setLoading(path);
 const { error } = await supabase
 .from("profiles").update({ chosen_path: path }).eq("user_id", user.id);
 if (error) { toast.error(error.message); setLoading(null); return; }
 await refreshProfile();
 toast.success(path === "jobs"? "Let's find you a job abroad! ": "Let's polish your documents! ");
 navigate(path === "jobs"? "/jobs": "/services");
 };

 if (checking) {
 return <div className="min-h-screen grid place-items-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
 }

 return (
 <div className="min-h-screen bg-background flex flex-col"><header className="flex items-center justify-between p-4 border-b border-border"><div className="flex items-center gap-2"><img src={logo} alt="Steve Safari"className="h-9 w-9"/><span className="font-heading font-bold text-foreground">Steve Safari</span></div><Button variant="ghost"size="sm"onClick={signOut}><LogOut size={14} />Sign Out</Button></header><main className="flex-1 flex items-center justify-center p-4"><div className="w-full max-w-3xl"><div className="text-center mb-8"><h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome, {profile?.full_name?.split("")[0] || "there"}!
 </h1><p className="text-muted-foreground text-sm sm:text-base">What brings you here today? Choose your path to get started.
 </p></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{/* Jobs path */}
 <button
 onClick={() =>choose("jobs")}
 disabled={loading !== null}
 className="group text-left bg-card border-2 border-border rounded-2xl p-6 hover:border-safari-gold hover:shadow-elegant transition-all disabled:opacity-50"><div className="w-14 h-14 rounded-xl bg-safari-green/10 text-safari-green grid place-items-center mb-4 group-hover:scale-110 transition-transform"><Briefcase size={28} /></div><h2 className="font-heading font-bold text-lg mb-2 text-foreground">Apply for Jobs Abroad
 </h2><p className="text-sm text-muted-foreground mb-4">Start your journey to secure a job and travel abroad — Canada and other countries.
 </p><div className="flex items-center gap-1 text-safari-gold font-medium text-sm">{loading === "jobs"? "Setting up...": "Get Started"}
 <ArrowRight size={16} /></div></button>{/* Services path */}
 <button
 onClick={() =>choose("services")}
 disabled={loading !== null}
 className="group text-left bg-card border-2 border-border rounded-2xl p-6 hover:border-safari-gold hover:shadow-elegant transition-all disabled:opacity-50"><div className="w-14 h-14 rounded-xl bg-safari-gold/10 text-safari-gold grid place-items-center mb-4 group-hover:scale-110 transition-transform"><FileText size={28} /></div><h2 className="font-heading font-bold text-lg mb-2 text-foreground">Improve My Documents
 </h2><p className="text-sm text-muted-foreground mb-4">Get professional help with your CV, cover letter, passport, visa and more.
 </p><div className="flex items-center gap-1 text-safari-gold font-medium text-sm">{loading === "services"? "Setting up...": "Get Started"}
 <ArrowRight size={16} /></div></button></div><p className="text-center text-xs text-muted-foreground mt-6">Don't worry — you can always switch later from your dashboard.
 </p></div></main></div>);
};

export default PathChoice;
