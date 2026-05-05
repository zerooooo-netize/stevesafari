import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import StepLayout from "@/components/onboarding/StepLayout";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { Loader2, Briefcase, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { withRetry } from "@/lib/dbRetry";

const JobsStep = () =>{
 const { user } = useAuth();
 const navigate = useNavigate();
 const { num } = useSettings(["max_active_applications"]);
 const max = num("max_active_applications", 3); // admin-configurable safety cap

 const [jobs, setJobs] = useState<any[]>([]);
 const [myApps, setMyApps] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [busy, setBusy] = useState<string | null>(null);

 const load = async () =>{
 if (!user) return;
 setLoading(true);
 const [jobsRes, appsRes] = await Promise.all([
 withRetry(async () =>await supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false })) as any,
 withRetry(async () =>await supabase.from("applications").select("id, job_id, status").eq("user_id", user.id)) as any,
 ]);
 setJobs(jobsRes.data || []);
 setMyApps(appsRes.data || []);
 setLoading(false);
 };
 useEffect(() =>{ load(); }, [user?.id]);

 const apply = async (jobId: string) =>{
 if (!user) return;
 if (myApps.length >= max) { toast.error(`You can apply to a maximum of ${max} jobs`); return; }
 if (myApps.some(a =>a.job_id === jobId)) { toast.info("Already applied to this job"); return; }
 setBusy(jobId);
 const { error } = await supabase.from("applications").insert({
 user_id: user.id, job_id: jobId, status: "registered",
 });
 setBusy(null);
 if (error) { toast.error(error.message); return; }
 toast.success("Application started");
 load();
 };

 const finish = () =>navigate("/onboarding/documents");

 if (loading) return<StepLayout stepNumber={3} totalSteps={7} title="Loading jobs…"><Loader2 className="animate-spin" /></StepLayout>;

 return (
<StepLayout
 stepNumber={3}
 totalSteps={7}
 title={`Pick up to ${max} jobs to apply for`}
 subtitle={`You've selected ${myApps.length} of ${max}.`}
 >
<div className="space-y-3">
 {jobs.length === 0 &&<p className="text-sm text-muted-foreground">No active jobs right now. Check back soon.</p>}
 {jobs.map(job =>{
 const applied = myApps.some(a =>a.job_id === job.id);
 return (
<div key={job.id} className="border border-border rounded-xl p-4 hover:border-primary/50 transition">
<div className="flex items-start justify-between gap-3">
<div className="flex-1 min-w-0">
<h3 className="font-semibold flex items-center gap-2">
<Briefcase size={16} className="text-primary" />
 {job.title}
</h3>
<p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
<MapPin size={12} />{[job.city, job.country].filter(Boolean).join(", ")}
</p>
 {job.salary &&<p className="text-sm mt-2">{job.salary}</p>}
</div>
 {applied ? (
<span className="text-green-600 text-xs flex items-center gap-1 shrink-0">
<CheckCircle2 size={14} />Applied
</span>
 ) : (
<Button
 size="sm"
 onClick={() =>apply(job.id)}
 disabled={busy === job.id || myApps.length >= max}
 >
 {busy === job.id ?<Loader2 size={14} className="animate-spin" />: "Apply"}
</Button>
 )}
</div>
</div>
 );
 })}
<div className="pt-4 border-t border-border">
<Button onClick={finish} disabled={myApps.length === 0} className="w-full">
 Continue to Documents → ({myApps.length} {myApps.length === 1 ? "application" : "applications"})
</Button>
</div>
</div>
</StepLayout>
 );
};

export default JobsStep;
