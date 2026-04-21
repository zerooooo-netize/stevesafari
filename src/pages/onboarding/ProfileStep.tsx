import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import StepLayout from "@/components/onboarding/StepLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ProfileStep = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", phone: "", id_number: "",
    date_of_birth: "", address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        id_number: profile.id_number || "",
        date_of_birth: profile.date_of_birth || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  const isJobs = profile?.chosen_path === "jobs";
  const totalSteps = isJobs ? 7 : 4;

  const save = async () => {
    if (!user) return;
    if (!form.full_name || !form.phone || !form.id_number) {
      toast.error("Full name, phone, and ID number are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      phone: form.phone,
      id_number: form.id_number,
      date_of_birth: form.date_of_birth || null,
      address: form.address || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("Profile saved");
    navigate(isJobs ? "/onboarding/registration-pay" : "/onboarding/services");
  };

  return (
    <StepLayout
      stepNumber={1}
      totalSteps={totalSteps}
      title="Complete your profile"
      subtitle="We need these details to verify you and prepare your application."
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input id="phone" placeholder="+254712345678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="id_number">National ID Number *</Label>
          <Input id="id_number" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full mt-4">
          {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
          Save & Continue →
        </Button>
      </div>
    </StepLayout>
  );
};

export default ProfileStep;
