import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, Briefcase, Search, Globe2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const JobsPage = () =>{
 const [jobs, setJobs] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 const { user } = useAuth();
 const navigate = useNavigate();

 useEffect(() =>{ loadJobs(); }, []);

 const loadJobs = async () =>{
 const { data } = await supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
 setJobs(data || []);
 setLoading(false);
 };

 const applyForJob = (jobId: string) =>{
 if (!user) { navigate(`/auth?redirect=/jobs/${jobId}`); return; }
 // Always route through the detail page so the registration + checklist gates fire
 navigate(`/jobs/${jobId}`);
 };

 const filtered = jobs.filter(j =>
 j.title.toLowerCase().includes(search.toLowerCase()) ||
 j.country.toLowerCase().includes(search.toLowerCase()) ||
 (j.city || "").toLowerCase().includes(search.toLowerCase())
 );

 return (
<div className="min-h-screen bg-background">
<Navbar />
<main className="pt-20 section-y-sm page-x">
<div className="max-w-6xl mx-auto">
<div className="text-center mb-6 sm:mb-10">
<h1 className="font-heading font-bold text-foreground">Available Jobs</h1>
<p className="text-muted-foreground mt-2 text-body max-w-md mx-auto">Find your dream job in Canada. Tap "Apply Now" to get started.</p>
</div>

 {/* Search */}
<div className="relative max-w-md mx-auto mb-8">
<Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
<Input
 value={search}
 onChange={(e) =>setSearch(e.target.value)}
 placeholder=" Search jobs by title, country, city..."
 className="pl-10 h-12 text-sm rounded-full"
 />
</div>

 {loading ? (
<div className="text-center text-muted-foreground py-12">Loading jobs...</div>
 ) : filtered.length === 0 ? (
<div className="text-center text-muted-foreground py-12">
<Briefcase size={48} className="mx-auto mb-3 opacity-30" />
<p>{search ? "No jobs match your search." : "No jobs available right now. Check back soon!"}</p>
</div>
 ) : (
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
 {filtered.map((job, i) =>(
<motion.div
 key={job.id}
 className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-card hover:shadow-elevated transition-shadow"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: i * 0.05 }}
 >
<div className="flex items-center justify-between mb-3">
<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-safari-gold/15 text-safari-gold"><Globe2 size={12} />{job.country || "Global"}</span>
<span className="text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{job.job_type}</span>
</div>
<h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">{job.title}</h3>
<div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm mt-1"><MapPin size={14} />{job.country}{job.city ? `, ${job.city}` : ""}</div>

 {job.description &&<p className="text-xs sm:text-sm text-muted-foreground mt-3 line-clamp-2">{job.description}</p>}

<div className="flex flex-wrap items-center gap-3 mt-4 text-xs sm:text-sm">
 {job.salary &&<div className="flex items-center gap-1 text-safari-gold font-semibold"><DollarSign size={14} />{job.salary}</div>}
 {job.deadline &&<div className="flex items-center gap-1 text-muted-foreground"><Clock size={14} />{new Date(job.deadline).toLocaleDateString()}</div>}
 {job.slots_available >0 &&<div className="flex items-center gap-1 text-muted-foreground"><Briefcase size={14} />{job.slots_available} slots</div>}
</div>

 {job.application_fee >0 && (
<p className="text-xs text-muted-foreground mt-3">Application fee: KES {Number(job.application_fee).toLocaleString()}</p>
 )}

<div className="flex gap-2 mt-4">
<Button variant="outline" className="flex-1 h-11 text-sm" asChild>
<Link to={`/jobs/${job.id}`}>View Details</Link>
</Button>
<Button className="flex-1 h-11 text-sm" onClick={() =>applyForJob(job.id)}>
 Apply
</Button>
</div>
</motion.div>
 ))}
</div>
 )}
</div>
</main>
<Footer />
</div>
 );
};

export default JobsPage;
