import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, Briefcase, Search, Globe2, Sparkles, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const JobsPage = () =>{
 const [jobs, setJobs] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 const { user } = useAuth();
 const { format } = useCurrency();
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
 placeholder="Search jobs by title, country, city..."
 className="pl-10 h-12 text-sm rounded-full"
 />
</div>

 {loading ? (
<div className="text-center text-muted-foreground section-y-sm">Loading jobs...</div>
 ) : filtered.length === 0 ? (
<div className="text-center text-muted-foreground section-y-sm">
<Briefcase size={48} className="mx-auto mb-3 opacity-30" />
<p>{search ? "No jobs match your search." : "No jobs available right now. Check back soon!"}</p>
</div>
 ) : (
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
 {filtered.map((job, i) => (
<motion.div
 key={job.id}
 className="group relative bg-card rounded-2xl border border-border/70 overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: i * 0.05 }}
>
  {/* Gradient accent header */}
  <div className="h-20 bg-gradient-to-br from-primary/90 via-primary/70 to-safari-gold/60 relative overflow-hidden">
    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-safari-gold/30 blur-2xl" />
    <div className="absolute inset-0 flex items-end justify-between p-3.5">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-safari-cream/95 text-primary backdrop-blur">
        <Globe2 size={12} />{job.country || "Global"}
      </span>
      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-foreground/20 text-safari-cream backdrop-blur">{job.job_type}</span>
    </div>
  </div>

  <div className="p-4 sm:p-5">
    <h3 className="font-heading text-base sm:text-lg font-bold text-foreground leading-tight">{job.title}</h3>
    <div className="flex items-center gap-1 text-muted-foreground text-caption mt-1">
      <MapPin size={13} />{job.country}{job.city ? `, ${job.city}` : ""}
    </div>

    {job.description && <p className="text-caption text-muted-foreground mt-3 line-clamp-2">{job.description}</p>}

    <div className="grid grid-cols-2 gap-2 mt-4">
      {job.salary && (
        <div className="rounded-xl bg-safari-gold/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Salary</p>
          <p className="text-safari-gold font-bold text-xs sm:text-sm flex items-center gap-1"><DollarSign size={12} />{job.salary}</p>
        </div>
      )}
      {job.deadline && (
        <div className="rounded-xl bg-muted/50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Deadline</p>
          <p className="font-semibold text-foreground text-xs sm:text-sm flex items-center gap-1"><Clock size={12} />{new Date(job.deadline).toLocaleDateString()}</p>
        </div>
      )}
    </div>

    {job.slots_available > 0 && (
      <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1"><Sparkles size={11} className="text-safari-gold" />{job.slots_available} slots remaining</p>
    )}

    {job.application_fee > 0 && (
      <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
        <span className="text-[11px] text-muted-foreground">Application fee</span>
        <span className="text-xs font-bold text-foreground">{format(Number(job.application_fee), "KES")}</span>
      </div>
    )}

    <div className="flex gap-2 mt-4">
      <Button variant="outline" className="flex-1 h-11 text-button" asChild>
        <Link to={`/jobs/${job.id}`}>Details</Link>
      </Button>
      <Button className="flex-1 h-11 text-button group-hover:shadow-md" onClick={() => applyForJob(job.id)}>
        Apply<ArrowRight size={14} className="ml-1" />
      </Button>
    </div>
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
