import { useEffect, useState } from "react";
import { Phone, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Settings {
 business_name?: string;
 business_phone?: string;
 business_email?: string;
 whatsapp_number?: string;
 verified_badge_enabled?: string;
 trust_bar_enabled?: string;
}

const TrustBar = () =>{
 const [s, setS] = useState<Settings>({});

 useEffect(() =>{
 supabase
 .from("settings")
 .select("key,value")
 .in("key", [
 "business_name",
 "business_phone",
 "business_email",
 "whatsapp_number",
 "verified_badge_enabled",
 "trust_bar_enabled",
 ])
 .then(({ data }) =>{
 const map: Settings = {};
 (data || []).forEach((r: any) =>((map as any)[r.key] = r.value));
 setS(map);
 });
 }, []);

 if (s.trust_bar_enabled === "false") return null;

 const phoneDigits = (s.business_phone || "").replace(/[^\d+]/g, "");
 const waDigits = (s.whatsapp_number || s.business_phone || "").replace(/[^\d]/g, "");

 return (
<div className="bg-primary text-primary-foreground text-xs py-1.5 px-3 border-b border-primary/20">
<div className="container flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
<div className="flex items-center gap-2 min-w-0">
 {s.verified_badge_enabled !== "false" && (
<span className="inline-flex items-center gap-1 bg-safari-gold/20 text-safari-gold px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
<ShieldCheck size={12} />Verified Agency
</span>
 )}
<span className="truncate font-medium">{s.business_name || "Steve Safari Agency"}</span>
</div>
<div className="flex items-center gap-3 sm:gap-4">
 {phoneDigits && (
<a href={`tel:${phoneDigits}`} className="inline-flex items-center gap-1 hover:text-safari-gold transition-colors" aria-label="Call us">
<Phone size={12} /><span className="hidden sm:inline">{s.business_phone}</span>
</a>
 )}
 {waDigits && (
<a
 href={`https://wa.me/${waDigits}`}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 hover:text-safari-gold transition-colors"
 aria-label="WhatsApp"
 >
<MessageCircle size={12} /><span className="hidden sm:inline">WhatsApp</span>
</a>
 )}
 {s.business_email && (
<a href={`mailto:${s.business_email}`} className="inline-flex items-center gap-1 hover:text-safari-gold transition-colors" aria-label="Email">
<Mail size={12} /><span className="hidden md:inline">{s.business_email}</span>
</a>
 )}
</div>
</div>
</div>
 );
};

export default TrustBar;
