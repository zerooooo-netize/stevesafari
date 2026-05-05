import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tag, X, Loader2 } from "lucide-react";

interface Props {
 userId: string;
 baseAmount: number;
 applyTo: "application_fee" | "service" | "any";
 onChange: (info: { code: string | null; discountAmount: number; finalAmount: number; source: "manual" | "referral_auto" | null }) =>void;
}

/**
 * Validates promo codes & auto-applies referral discount on first application_fee payment.
 * - Reads `referral_signup_discount_enabled` + `referral_signup_discount` from settings.
 * - Auto-discount only if user is a referred user AND has no completed application_fee payment yet.
 */
const DiscountCodeInput = ({ userId, baseAmount, applyTo, onChange }: Props) =>{
 const [code, setCode] = useState("");
 const [applied, setApplied] = useState<{ code: string; amount: number; source: "manual" | "referral_auto" } | null>(null);
 const [validating, setValidating] = useState(false);
 const [autoChecked, setAutoChecked] = useState(false);

 // Auto-apply referral signup discount once
 useEffect(() =>{
 if (autoChecked || !userId || baseAmount<= 0 || applyTo !== "application_fee") return;
 setAutoChecked(true);
 (async () =>{
 const [{ data: settings }, { data: ref }, { data: prevPays }, { data: prevRedeem }] = await Promise.all([
 supabase.from("settings").select("key,value").in("key", ["referral_signup_discount_enabled", "referral_signup_discount"]),
 supabase.from("referrals").select("id").eq("referred_user_id", userId).maybeSingle(),
 supabase.from("payments").select("id").eq("user_id", userId).eq("payment_type", "application_fee").eq("status", "completed").limit(1),
 supabase.from("discount_redemptions").select("id").eq("user_id", userId).eq("source", "referral_auto").limit(1),
 ]);
 const map = Object.fromEntries((settings || []).map((s: any) =>[s.key, s.value]));
 const enabled = map.referral_signup_discount_enabled !== "false";
 const amount = Number(map.referral_signup_discount || 0);
 if (!enabled || amount<= 0) return;
 if (!ref) return; // not a referred user
 if ((prevPays || []).length >0) return; // already paid before
 if ((prevRedeem || []).length >0) return; // already used auto-discount
 const finalDiscount = Math.min(amount, baseAmount);
 const auto = { code: "REFERRAL", amount: finalDiscount, source: "referral_auto" as const };
 setApplied(auto);
 onChange({
 code: auto.code,
 discountAmount: finalDiscount,
 finalAmount: Math.max(0, baseAmount - finalDiscount),
 source: "referral_auto",
 });
 toast.success(` Referral discount of KES ${finalDiscount.toLocaleString()} auto-applied!`);
 })();
 }, [userId, baseAmount, applyTo, autoChecked, onChange]);

 // When base amount or applied changes, push update upward
 useEffect(() =>{
 if (!applied) {
 onChange({ code: null, discountAmount: 0, finalAmount: baseAmount, source: null });
 } else {
 const capped = Math.min(applied.amount, baseAmount);
 onChange({ code: applied.code, discountAmount: capped, finalAmount: Math.max(0, baseAmount - capped), source: applied.source });
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [baseAmount, applied?.code]);

 const apply = async () =>{
 if (!code.trim()) return;
 setValidating(true);
 const upper = code.trim().toUpperCase();
 const { data: c, error } = await supabase
 .from("discount_codes")
 .select("*")
 .eq("code", upper)
 .eq("is_active", true)
 .maybeSingle();
 setValidating(false);
 if (error || !c) {
 toast.error("Invalid or expired code");
 return;
 }
 if (c.expires_at && new Date(c.expires_at)< new Date()) {
 toast.error("This code has expired");
 return;
 }
 if (c.max_uses && c.uses_count >= c.max_uses) {
 toast.error("This code has reached its usage limit");
 return;
 }
 if (c.applies_to !== "any" && c.applies_to !== applyTo) {
 toast.error(`This code only applies to ${c.applies_to.replace("_", " ")}`);
 return;
 }
 const discountAmt =
 c.discount_type === "fixed"
 ? Math.min(Number(c.discount_value), baseAmount)
 : Math.min(Math.round((baseAmount * Number(c.discount_value)) / 100), baseAmount);
 setApplied({ code: c.code, amount: discountAmt, source: "manual" });
 setCode("");
 toast.success(` ${c.code} applied - KES ${discountAmt.toLocaleString()} off`);
 };

 const remove = () =>{
 setApplied(null);
 toast.info("Discount removed");
 };

 if (applied) {
 return (
<div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 rounded-lg px-3 py-2 text-sm">
<span className="flex items-center gap-2">
<Tag size={14} />
<strong>{applied.code}</strong>- KES {Math.min(applied.amount, baseAmount).toLocaleString()} off
</span>
 {applied.source === "manual" && (
<button onClick={remove} className="text-green-700 hover:text-green-900" aria-label="Remove discount">
<X size={16} />
</button>
 )}
</div>
 );
 }

 return (
<div>
<Label className="text-xs">Have a discount code? (optional)</Label>
<div className="flex gap-2">
<Input
 value={code}
 onChange={(e) =>setCode(e.target.value.toUpperCase())}
 placeholder="EARLYBIRD2000"
 className="text-sm uppercase"
 maxLength={32}
 />
<Button size="sm" variant="outline" onClick={apply} disabled={validating || !code.trim()}>
 {validating ?<Loader2 size={14} className="animate-spin" />: "Apply"}
</Button>
</div>
</div>
 );
};

export default DiscountCodeInput;
