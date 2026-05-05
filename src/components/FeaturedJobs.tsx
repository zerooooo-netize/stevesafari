import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, ArrowRight, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const jobs = [
 {
 title: "Farm Worker",
 country: "Canada",
 salary: "CAD 3,200/mo",
 type: "Full-Time",
 deadline: "May 30, 2026",
 flag: "",
 },
 {
 title: "Warehouse Associate",
 country: "Canada",
 salary: "CAD 3,500/mo",
 type: "Full-Time",
 deadline: "Jun 15, 2026",
 flag: "",
 },
 {
 title: "Construction Labourer",
 country: "Canada",
 salary: "CAD 3,800/mo",
 type: "Contract",
 deadline: "Jul 1, 2026",
 flag: "",
 },
];

const FeaturedJobs = () =>{
 return (
<section className="py-20 bg-background">
<div className="container">
<motion.div
 className="text-center mb-12"
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 >
<span className="text-sm font-medium text-safari-gold uppercase tracking-wider">Opportunities</span>
<h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2">
 Featured Jobs
</h2>
<p className="text-muted-foreground mt-3 max-w-md mx-auto">
 Explore current openings with verified employers across Canada and beyond.
</p>
</motion.div>

<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {jobs.map((job, i) =>(
<motion.div
 key={job.title}
 className="bg-card rounded-lg border border-border p-6 shadow-card hover:shadow-elevated transition-shadow"
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.4, delay: i * 0.1 }}
 >
<div className="flex items-center justify-between mb-4">
<span className="text-3xl">{job.flag}</span>
<span className="text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
 {job.type}
</span>
</div>
<h3 className="font-heading text-lg font-semibold text-foreground">{job.title}</h3>
<div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
<MapPin size={14} />{job.country}
</div>
<div className="flex items-center gap-4 mt-4 text-sm">
<div className="flex items-center gap-1 text-safari-gold font-semibold">
<DollarSign size={14} />{job.salary}
</div>
<div className="flex items-center gap-1 text-muted-foreground">
<Clock size={14} />{job.deadline}
</div>
</div>
<Button className="w-full mt-5" size="sm">
 Apply Now
</Button>
</motion.div>
 ))}
</div>

<div className="text-center mt-10">
<Button variant="outline" size="lg">
 View All Jobs<ArrowRight size={16} />
</Button>
</div>
</div>
</section>
 );
};

export default FeaturedJobs;
