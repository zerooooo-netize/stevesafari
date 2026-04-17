import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2, Gift, Users } from "lucide-react";
import { toast } from "sonner";

interface Props {
  userId: string;
  referralCode: string | null;
}

const ReferralCard = ({ userId, referralCode }: Props) => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [bonusAmount, setBonusAmount] = useState<string>("0");
  const [enabled, setEnabled] = useState(true);

  const link = referralCode
    ? `${window.location.origin}/auth?ref=${referralCode}`
    : "";

  const load = async () => {
    const [{ data: refs }, { data: settings }] = await Promise.all([
      supabase.from("referrals").select("*").eq("referrer_id", userId).order("created_at", { ascending: false }),
      supabase.from("settings").select("key,value").in("key", ["referral_bonus_amount", "referral_enabled"]),
    ]);
    setReferrals(refs || []);
    const map = Object.fromEntries((settings || []).map((s: any) => [s.key, s.value]));
    setBonusAmount(map.referral_bonus_amount || "0");
    setEnabled(map.referral_enabled !== "false");
  };

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  const copy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const share = async () => {
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

  const successful = referrals.filter((r) => r.status === "rewarded" || r.reward_paid).length;
  const totalEarned = referrals
    .filter((r) => r.reward_paid)
    .reduce((sum, r) => sum + Number(r.reward_amount || 0), 0);

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="text-safari-gold" size={20} />
        <h3 className="font-heading font-semibold text-foreground">Refer & Earn</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Share your link. Earn <span className="font-semibold text-safari-gold">KES {bonusAmount}</span> when someone you refer pays their application fee.
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

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/50 rounded p-2">
          <Users className="mx-auto text-muted-foreground mb-1" size={16} />
          <p className="text-xs text-muted-foreground">Invited</p>
          <p className="font-bold text-foreground">{referrals.length}</p>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <p className="text-xs text-muted-foreground mt-5">Successful</p>
          <p className="font-bold text-safari-gold">{successful}</p>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <p className="text-xs text-muted-foreground mt-5">Earned</p>
          <p className="font-bold text-foreground">KES {totalEarned}</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralCard;
