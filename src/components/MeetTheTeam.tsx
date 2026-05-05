import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Member {
 id: string;
 full_name: string;
 role: string;
 bio: string | null;
 photo_url: string | null;
}

const MeetTheTeam = () =>{
 const [team, setTeam] = useState<Member[]>([]);
 const [enabled, setEnabled] = useState(true);

 useEffect(() =>{
 Promise.all([
 supabase.from("team_members").select("*").eq("is_active", true).order("display_order"),
 supabase.from("settings").select("value").eq("key", "team_section_enabled").maybeSingle(),
 ]).then(([{ data }, { data: setting }]) =>{
 setTeam(data || []);
 if (setting?.value === "false") setEnabled(false);
 });
 }, []);

 if (!enabled || team.length === 0) return null;

 return (
<section className="py-16 bg-muted/30">
<div className="container">
<div className="text-center mb-10">
<span className="text-sm font-medium text-safari-gold uppercase tracking-wider">Real People</span>
<h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2">Meet Our Team</h2>
<p className="text-muted-foreground mt-3 max-w-md mx-auto">
 The humans behind your journey. We're here to support you every step of the way.
</p>
</div>
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
 {team.map((m) =>(
<div key={m.id} className="bg-card border border-border rounded-xl p-4 text-center shadow-card">
 {m.photo_url ? (
<img
 src={m.photo_url}
 alt={m.full_name}
 loading="lazy"
 className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
 />
 ) : (
<div className="w-20 h-20 rounded-full bg-safari-gold/20 flex items-center justify-center mx-auto mb-3 text-safari-gold font-bold text-xl">
 {m.full_name.split(" ").map((n) =>n[0]).slice(0, 2).join("")}
</div>
 )}
<h3 className="font-heading font-semibold text-sm text-foreground">{m.full_name}</h3>
<p className="text-xs text-safari-gold mt-0.5">{m.role}</p>
 {m.bio &&<p className="text-xs text-muted-foreground mt-2 line-clamp-3">{m.bio}</p>}
</div>
 ))}
</div>
</div>
</section>
 );
};

export default MeetTheTeam;
