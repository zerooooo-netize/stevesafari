import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import StepLayout from "@/components/onboarding/StepLayout";
import { Button } from "@/components/ui/button";
import { Hourglass, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { withRetry } from "@/lib/dbRetry";

const BatchStep = () =>{
 const { user } = useAuth();
 const navigate = useNavigate();
 const [apps, setApps] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 const load = async () =>{
 if (!user) return;
 const r: any = await withRetry(async () =>await supabase
 .from("applications")
 .select(" id, status, batch_ready, jobs(title, country)")
 .eq("user_id", user.id));
 setApps(r.data || []);
 setLoading(false);
 };
 useEffect(() =>{ load(); }, [user?.id]);

 const ready = apps.some(a =>a.batch_ready);

 if (loading) return<StepLayout stepNumber={5} totalSteps={7} title=" Loading…"><Loader2 className="animate-spin"/></StepLayout>;

 return (
<StepLayout
 stepNumber={5}
 totalSteps={7}
 title={ready ? " You' ve been assigned to a travel batch": "Waiting for travel batch assignment"}
 subtitle={ready ? " Admin has cleared you for travel. Continue to plan your accommodation.": "Our team is reviewing your documents and matching you to a batch. We' ll notify you by email."}
 ><div className="space-y-4"><div className={`rounded-xl p-5 flex items-start gap-3 ${ready ? " bg-green-50 border border-green-200": " bg-amber-50 border border-amber-200"}`}>{ready ?<CheckCircle2 className="text-green-600 shrink-0"/>:<Hourglass className="text-amber-600 shrink-0"/>}
<div className="text-sm">{ready ? (
<p className="text-green-900">All set! Move on to the accommodation step.</p>) : (
<><p className="text-amber-900 font-semibold mb-1">Status: Pending batch assignment</p><p className="text-amber-800 text-xs">Typical wait: 5–14 days. You' ll be notified by email & SMS.</p></>)}
</div></div><div className="space-y-2"><h4 className="text-sm font-semibold">Your applications</h4>{apps.map(a =>(
<div key={a.id} className="flex items-center justify-between p-3 bg-muted/40 rounded"><div><p className="text-sm font-medium">{a.jobs?.title || "Job"}</p><p className="text-xs text-muted-foreground">{a.jobs?.country}</p></div><span className={`text-xs px-2 py-1 rounded ${a.batch_ready ? " bg-green-100 text-green-800": " bg-amber-100 text-amber-800"}`}>{a.batch_ready ? "Ready": "Pending"}
</span></div>))}
</div>{ready ? (
<Button onClick={() =>navigate("/onboarding/sponsorship")} className="w-full">Continue to Accommodation<ArrowRight size={16} className="ml-2"/></Button>) : (
<Button variant="outline" onClick={() =>navigate("/dashboard")} className="w-full">Go to Dashboard
</Button>)}
</div></StepLayout>);
};

export default BatchStep;
