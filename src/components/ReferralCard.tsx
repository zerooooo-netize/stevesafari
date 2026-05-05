import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2, Gift, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

interface Props {
 userId: string;
 referralCode: string | null;
}

const ReferralCard = ({ userId, referralCode }: Props) =>{
 const [referrals, setReferrals] = useState<any[]>([]);
 const [redemptions, setRedemptions] = useState<any[]>([]);
 const [bonusAmount, setBonusAmount] = useState<string>("0");
 const [autoThreshold, setAutoThreshold] = useState<number>(2000);
 const [enabled, setEnabled] = useState(true);
 const [redeemAmt, setRedeemAmt] = useState("");
 const [redeemPurpose, setRedeemPurpose] = useState("");
 const [redeeming, setRedeeming] = useState(false);

 const link = referralCode
 ? `${window.location.origin}/auth?ref=${referralCode}`
 : "";

 const load = async () =>{
 const [{ data: refs }, { data: settings }, { data: reds }] = await Promise.all([
 supabase.from("referrals").select("*").eq("referrer_id", userId).order("created_at", { ascending: false }),
 supabase.from("settings").select("key,value").in("key", ["referral_bonus_amount", "referral_enabled", "wallet_auto_threshold"]),
 supabase.from("wallet_redemptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
 ]);
 setReferrals(refs || []);
 setRedemptions(reds || []);
 const map = Object.fromEntries((settings || []).map((s: any) =>[s.key, s.value]));
 setBonusAmount(map.referral_bonus_amount || "0");
 setAutoThreshold(Number(map.wallet_auto_threshold || 2000));
 setEnabled(map.referral_enabled !== "false");
 };

 useEffect(() =>{
 if (userId) load();
 }, [userId]);

 const copy = () =>{
 if (!link) return;
 navigator.clipboard.writeText(link);
 toast.success("Referral link copied!");
 };

 const share = async () =>{
 if (!link) return;
 const text = `Apply for jobs abroad with Steve Safari. Use my link: ${link}`;
 if (navigator.share) {
 try {
 await navigator.share({ title: "Steve Safari", text, url: link });
 } catch {}
 } else {
 window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
 }
 };

 if (!enabled) return null;

 const successful = referrals.filter((r) =>r.status === "rewarded" || r.reward_paid).length;
 const totalEarned = referrals
 .filter((r) =>r.reward_paid)
 .reduce((sum, r) =>sum + Number(r.reward_amount || 0), 0);
 const totalUsed = redemptions
 .filter(r =>r.status === "approved" || r.status === "applied" || r.status === "pending")
 .reduce((s, r) =>s + Number(r.amount || 0), 0);
 const available = Math.max(0, totalEarned - totalUsed);

 const submitRedeem = async () =>{
 const amt = Number(redeemAmt);
 if (!amt || amt<= 0) { toast.error("Enter amount"); return; }
 if (amt >available) { toast.error(`You only have KES ${available} available`); return; }
 if (!redeemPurpose.trim()) { toast.error("What is this for?"); return; }
 setRedeeming(true);
 const status = amt<= autoThreshold ? "approved" : "pending";
 const { error } = await supabase.from("wallet_redemptions").insert({
 user_id: userId, amount: amt, purpose: redeemPurpose.trim().slice(0, 200), status,
 });
 if (error) { toast.error(error.message); setRedeeming(false); return; }
 toast.success(status === "approved"
 ? " Auto-approved! Show this to admin to apply on your account."
 : "⏳ Submitted for admin approval.");
 setRedeemAmt(""); setRedeemPurpose("");
 load();
 setRedeeming(false);
 };

 return (
<div className="bg-card border border-border rounded-lg p-5 shadow-card">
<div className="flex items-center gap-2 mb-1">
<Gift className="text-safari-gold" size={20} />
<h3 className="font-heading font-semibold text-foreground">Refer & Earn</h3>
</div>
<p className="text-sm text-muted-foreground mb-4">
 Share your link. Earn<span className="font-semibold text-safari-gold">KES {bonusAmount}</span>when someone you refer pays their application fee.
</p>

<div className="flex gap-2 mb-4">
<Input value={link} readOnly className="text-xs" />
<Button size="icon" variant="outline" onClick={copy} aria-label="Copy link">
<Copy size={16} />
</Button>
<Button size="icon" onClick={share} aria-label="Share link">
<Share2 size={16} />
</Button>
</div>

<div className="grid grid-cols-3 gap-2 text-center mb-5">
<div className="bg-muted/50 rounded p-2">
<Users className="mx-auto text-muted-foreground mb-1" size={16} />
<p className="text-xs text-muted-foreground">Invited</p>
<p className="font-bold text-foreground">{referrals.length}</p>
</div>
<div className="bg-muted/50 rounded p-2">
<p className="text-xs text-muted-foreground">Successful</p>
<p className="font-bold text-safari-gold">{successful}</p>
</div>
<div className="bg-muted/50 rounded p-2">
<p className="text-xs text-muted-foreground">Earned</p>
<p className="font-bold text-foreground">KES {totalEarned.toLocaleString()}</p>
</div>
</div>

 {/* Wallet section */}
<div className="border-t border-border pt-4">
<div className="flex items-center justify-between mb-2">
<div className="flex items-center gap-2">
<Wallet size={16} className="text-safari-gold" />
<span className="text-sm font-semibold text-foreground">My Wallet</span>
</div>
<span className="text-sm font-bold text-safari-gold">KES {available.toLocaleString()}</span>
</div>
<p className="text-[11px] text-muted-foreground mb-3">
 Use referral earnings to pay for documents, services or balances.
 Amounts up to KES {autoThreshold.toLocaleString()} are auto-approved.
</p>
<div className="flex flex-col gap-2">
<Input
 type="number" min="0" max={available}
 value={redeemAmt}
 onChange={e =>setRedeemAmt(e.target.value)}
 placeholder={`Amount (max ${available})`}
 className="text-sm"
 disabled={available<= 0}
 />
<Input
 value={redeemPurpose}
 onChange={e =>setRedeemPurpose(e.target.value)}
 maxLength={200}
 placeholder="What is this for? e.g. CV rewrite"
 className="text-sm"
 disabled={available<= 0}
 />
<Button onClick={submitRedeem} disabled={redeeming || available<= 0} className="text-sm">
 {redeeming ? "Submitting..." : "Use Wallet to Pay"}
</Button>
</div>

 {redemptions.length >0 && (
<div className="mt-4 space-y-1">
<h4 className="text-xs font-semibold text-muted-foreground mb-1">Recent</h4>
 {redemptions.slice(0, 5).map(r =>(
<div key={r.id} className="flex items-center justify-between text-xs bg-muted/40 rounded p-2">
<div className="min-w-0 flex-1">
<p className="font-medium">KES {Number(r.amount).toLocaleString()}</p>
<p className="text-muted-foreground truncate">{r.purpose}</p>
</div>
<span className={`shrink-0 px-2 py-0.5 rounded-full ${
 r.status === "approved" || r.status === "applied" ? "bg-green-100 text-green-700"
 : r.status === "rejected" ? "bg-red-100 text-red-700"
 : "bg-yellow-100 text-yellow-700"
 }`}>{r.status}</span>
</div>
 ))}
</div>
 )}
</div>
</div>
 );
};

export default ReferralCard;
