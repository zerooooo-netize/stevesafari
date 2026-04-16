import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, Briefcase } from "lucide-react";
import { toast } from "sonner";

const JobsPage = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  const applyForJob = async (jobId: string) => {
    if (!user) { navigate("/auth"); return; }
    const { error } = await supabase.from("applications").insert({ user_id: user.id, job_id: jobId });
    if (error) {
      if (error.code === "23505") toast.error("You've already applied for this job.");
      else toast.error(error.message);
      return;
    }
    toast.success("Application submitted! Check your dashboard for updates.");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Available Jobs</h1>
            <p className="text-muted-foreground mt-2">Browse current openings and apply today.</p>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-12">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">No jobs available at the moment. Check back soon!</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  className="bg-card rounded-lg border border-border p-6 shadow-card hover:shadow-elevated transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{job.country === "Canada" ? "🇨🇦" : "🌍"}</span>
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground">{job.job_type}</span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">{job.title}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1"><MapPin size={14} /> {job.country}{job.city ? `, ${job.city}` : ""}</div>

                  {job.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{job.description}</p>}

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                    {job.salary && <div className="flex items-center gap-1 text-safari-gold font-semibold"><DollarSign size={14} /> {job.salary}</div>}
                    {job.deadline && <div className="flex items-center gap-1 text-muted-foreground"><Clock size={14} /> {new Date(job.deadline).toLocaleDateString()}</div>}
                    {job.slots_available > 0 && <div className="flex items-center gap-1 text-muted-foreground"><Briefcase size={14} /> {job.slots_available} slots</div>}
                  </div>

                  {job.application_fee > 0 && (
                    <p className="text-xs text-muted-foreground mt-3">Application fee: KES {Number(job.application_fee).toLocaleString()}</p>
                  )}

                  <Button className="w-full mt-4" onClick={() => applyForJob(job.id)}>
                    Apply Now
                  </Button>
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
