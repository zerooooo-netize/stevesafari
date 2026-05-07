import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Story {
 id: string;
 full_name: string;
 job_title: string | null;
 country: string | null;
 story: string;
 image_url: string | null;
}

const SuccessStories = () =>{
 const [stories, setStories] = useState<Story[]>([]);

 useEffect(() =>{
 supabase
 .from("success_stories")
 .select("*")
 .eq("is_active", true)
 .order("display_order", { ascending: true })
 .then(({ data }) =>setStories((data as Story[]) || []));
 }, []);

 if (stories.length === 0) return null;

 return (
<section className="section-y-lg bg-muted/30">
<div className="container page-x">
<div className="text-center mb-12 max-w-2xl mx-auto">
<span className="inline-block text-xs font-semibold text-safari-gold uppercase tracking-[0.2em] bg-safari-gold/10 px-3 py-1 rounded-full">Testimonials</span>
<h2 className="font-heading text-h1 font-bold text-foreground mt-4 mb-4">
 Success<span className="text-safari-gold"> Stories</span>
</h2>
<p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
 Real Kenyans, real journeys. Hear from those who made it abroad with Steve Safari.
</p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {stories.map((s, i) =>(
<motion.div
 key={s.id}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1 }}
 className="bg-card border border-border rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow"
 >
<Quote className="text-safari-gold mb-3" size={28} />
<p className="text-muted-foreground text-sm leading-relaxed mb-5">"{s.story}"</p>
<div className="flex items-center gap-3 pt-4 border-t border-border">
 {s.image_url ? (
<img
 src={s.image_url}
 alt={s.full_name}
 loading="lazy"
 className="w-12 h-12 rounded-full object-cover"
 />
 ) : (
<div className="w-12 h-12 rounded-full bg-safari-gold/20 flex items-center justify-center text-safari-gold font-bold">
 {s.full_name.charAt(0)}
</div>
 )}
<div>
<p className="font-heading font-semibold text-foreground text-sm">{s.full_name}</p>
<p className="text-xs text-muted-foreground">
 {s.job_title}{s.country ? ` · ${s.country}` : ""}
</p>
</div>
</div>
</motion.div>
 ))}
</div>
</div>
</section>
 );
};

export default SuccessStories;
