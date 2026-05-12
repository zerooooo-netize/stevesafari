import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, FileText, MapPin, DollarSign } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

/** Compact dynamic preview of latest jobs (max 3) and services (max 4), DB-driven, with CTAs to detail pages. */
export const JobsPreview = () =>{
 const [jobs, setJobs] = useState<any[]>([]);
 useEffect(() =>{
 supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(3)
 .then(({ data }) =>setJobs(data || []));
 }, []);
 if (jobs.length === 0) return null;
 return (
<section className="section-y-lg bg-muted/30">
<div className="container page-x">
<div className="flex items-end justify-between mb-10 flex-wrap gap-3">
<div>
<span className="inline-block text-xs font-semibold text-safari-gold uppercase tracking-[0.2em] bg-safari-gold/10 px-3 py-1 rounded-full">Open Roles</span>
<h2 className="font-heading text-h2 font-bold text-foreground mt-3">Featured Jobs</h2>
</div>
<Button variant="outline" size="sm" asChild><Link to="/jobs">View all<ArrowRight size={14} /></Link></Button>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {jobs.map((j, i) =>(
<motion.div
 key={j.id}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.08 }}
 className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all"
 >
<span className="inline-flex items-center gap-1 text-[10px] bg-safari-gold/15 text-safari-gold px-2 py-0.5 rounded-full font-medium">
<Briefcase size={10} />{j.job_type || "Full-Time"}
</span>
<h3 className="font-heading font-bold text-base mt-3">{j.title}</h3>
<p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
<MapPin size={11} />{j.city ? `${j.city}, ` : ""}{j.country}
</p>
<div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
<div>
<p className="text-[10px] text-muted-foreground">Fee</p>
<p className="font-bold text-safari-gold text-sm">KES {Number(j.application_fee || 0).toLocaleString()}</p>
</div>
<Button size="sm" variant="outline" asChild><Link to={`/jobs/${j.id}`}>View →</Link></Button>
</div>
</motion.div>
 ))}
</div>
</div>
</section>
 );
};

export const ServicesPreview = () =>{
 const [services, setServices] = useState<any[]>([]);
 useEffect(() =>{
 supabase.from("services").select("*").eq("is_active", true).order("created_at").limit(4)
 .then(({ data }) =>setServices(data || []));
 }, []);
 if (services.length === 0) return null;
 return (
<section className="section-y-lg">
<div className="container page-x">
<div className="flex items-end justify-between mb-10 flex-wrap gap-3">
<div>
<span className="inline-block text-xs font-semibold text-safari-gold uppercase tracking-[0.2em] bg-safari-gold/10 px-3 py-1 rounded-full">Document Services</span>
<h2 className="font-heading text-h2 font-bold text-foreground mt-3">Get Your Papers Right</h2>
</div>
<Button variant="outline" size="sm" asChild><Link to="/services">All services<ArrowRight size={14} /></Link></Button>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {services.map((s, i) =>(
<motion.div
 key={s.id}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.08 }}
 className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all flex flex-col"
 >
<div className="w-10 h-10 rounded-lg bg-safari-gold/15 text-safari-gold grid place-items-center mb-3">
<FileText size={20} />
</div>
<h3 className="font-heading font-semibold text-sm">{s.name}</h3>
<p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-1">{s.description}</p>
<div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
<p className="font-bold text-safari-gold text-sm">{s.currency || "KES"} {Number(s.price).toLocaleString()}</p>
<Button size="sm" variant="outline" asChild><Link to={`/services/${s.id}`}>Order →</Link></Button>
</div>
</motion.div>
 ))}
</div>
</div>
</section>
 );
};
