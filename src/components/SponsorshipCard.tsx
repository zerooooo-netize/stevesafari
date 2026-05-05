import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HandCoins, Info } from "lucide-react";
import { toast } from "sonner";

interface Props { userId: string; }

const statusColors: Record<string, string>= {
 pending: "bg-yellow-100 text-yellow-700",
 fee_pending: "bg-yellow-100 text-yellow-700",
 approved: "bg-green-100 text-green-700",
 rejected: "bg-red-100 text-red-700",
};

const SponsorshipCard = ({ userId }: Props) =>{
 const [enabled, setEnabled] = useState(true);
 const [fee, setFee] = useState("0");
 const [reason, setReason] = useState("");
 const [amount, setAmount] = useState("");
 const [list, setList] = useState<any[]>([]);
 const [submitting, setSubmitting] = useState(false);

 const load = async () =>{
 const [{ data: settings }, { data: apps }] = await Promise.all([
 supabase.from("settings").select("key,value").in("key", ["sponsorship_fee", "sponsorship_enabled"]),
 supabase.from("sponsorship_applications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
 ]);
 const map = Object.fromEntries((settings || []).map((s: any) =>[s.key, s.value]));
 setEnabled(map.sponsorship_enabled !== "false");
 setFee(map.sponsorship_fee || "0");
 setList(apps || []);
 };

 useEffect(() =>{ if (userId) load(); }, [userId]);

 const submit = async () =>{
 if (!reason.trim() || reason.trim().length< 20) {
 toast.error("Please explain your situation (at least 20 characters)");
 return;
 }
 if (!amount || Number(amount)<= 0) {
 toast.error("Enter the amount of help you need");
 return;
 }
 setSubmitting(true);
 const { error } = await supabase.from("sponsorship_applications").insert({
 user_id: userId,
 reason: reason.trim().slice(0, 1000),
 requested_amount: Number(amount),
 status: "fee_pending",
 });
 if (error) { toast.error(error.message); setSubmitting(false); return; }
 toast.success("Application submitted! Pay the small fee from the Payments tab to activate review.");
 setReason(""); setAmount("");
 load();
 setSubmitting(false);
 };

 if (!enabled) return null;

 return (
<div className="bg-card border border-border rounded-lg p-5 shadow-card">
<div className="flex items-center gap-2 mb-1">
<HandCoins className="text-safari-gold" size={20} />
<h3 className="font-heading font-semibold text-foreground">Need Financial Help?</h3>
</div>
<p className="text-sm text-muted-foreground mb-4">
 Apply for sponsorship assistance if you cannot afford the full process. A small<span className="font-semibold text-foreground">KES {Number(fee).toLocaleString()}</span>non-refundable application fee applies.
</p>

<div className="space-y-3 mb-5">
<div>
<Label className="text-xs">Amount you need (KES)</Label>
<Input type="number" min="0" value={amount} onChange={e =>setAmount(e.target.value)} placeholder="e.g. 15000" className="text-sm" />
</div>
<div>
<Label className="text-xs">Tell us your situation</Label>
<Textarea
 value={reason}
 maxLength={1000}
 onChange={e =>setReason(e.target.value)}
 placeholder="Briefly explain why you need sponsorship..."
 className="text-sm min-h-[100px]"
 />
<p className="text-[10px] text-muted-foreground mt-1">{reason.length}/1000</p>
</div>
<Button onClick={submit} disabled={submitting} className="w-full text-sm">
 {submitting ? "Submitting..." : "Apply for Sponsorship"}
</Button>
<div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded p-2">
<Info size={14} className="shrink-0 mt-0.5" />
<p>Admin reviews each request. You'll be notified by email once a decision is made.</p>
</div>
</div>

 {list.length >0 && (
<div>
<h4 className="text-xs font-semibold text-muted-foreground mb-2">My Applications</h4>
<div className="space-y-2">
 {list.map(s =>(
<div key={s.id} className="flex items-center justify-between bg-muted/40 rounded p-2 text-xs">
<div className="min-w-0 flex-1">
<p className="font-medium">KES {Number(s.requested_amount).toLocaleString()}</p>
<p className="text-muted-foreground truncate">{s.reason}</p>
 {s.admin_notes &&<p className="text-muted-foreground italic mt-1">Admin: {s.admin_notes}</p>}
</div>
<span className={`shrink-0 px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] || "bg-muted"}`}>
 {s.status.replace("_", " ")}
</span>
</div>
 ))}
</div>
</div>
 )}
</div>
 );
};

export default SponsorshipCard;
