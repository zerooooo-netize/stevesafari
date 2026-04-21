import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import StepLayout from "@/components/onboarding/StepLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2, Loader2, ShoppingBag, Plus } from "lucide-react";
import { toast } from "sonner";
import { withRetry } from "@/lib/dbRetry";

const COMMON_DOCS = ["Passport", "National ID", "CV / Resume", "Educational Certificates", "Police Clearance"];

const DocumentsStep = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(COMMON_DOCS[0]);

  const isJobs = profile?.chosen_path === "jobs";
  const totalSteps = isJobs ? 7 : 4;
  const stepNum = isJobs ? 4 : 3;

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [d, s] = await Promise.all([
      withRetry(async () => await supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false })) as any,
      withRetry(async () => await supabase.from("services").select("*").eq("is_active", true).order("price")) as any,
    ]);
    setDocs(d.data || []);
    setServices(s.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("user-documents").upload(path, file);
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { data: { publicUrl } } = supabase.storage.from("user-documents").getPublicUrl(path);
    const { error: insErr } = await supabase.from("documents").insert({
      user_id: user.id, document_type: docType, file_name: file.name, file_url: publicUrl,
    });
    setUploading(false);
    if (insErr) { toast.error(insErr.message); return; }
    toast.success("Uploaded");
    load();
  };

  const orderService = async (serviceId: string) => {
    if (!user) return;
    const { error } = await supabase.from("service_orders").insert({
      user_id: user.id, service_id: serviceId, status: "pending",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Service ordered — pay from your dashboard");
  };

  const next = () => navigate(isJobs ? "/onboarding/batch" : "/onboarding/ready");

  if (loading) return <StepLayout stepNumber={stepNum} totalSteps={totalSteps} title="Loading…"><Loader2 className="animate-spin" /></StepLayout>;

  return (
    <StepLayout
      stepNumber={stepNum}
      totalSteps={totalSteps}
      title="Upload your documents"
      subtitle="Upload what you have. Don't have a document? Order it from us."
    >
      <div className="space-y-5">
        {/* Upload */}
        <div className="border-2 border-dashed border-border rounded-xl p-4 space-y-3">
          <div>
            <Label>Document type</Label>
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {COMMON_DOCS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <Label htmlFor="file" className="block">
            <div className="flex items-center justify-center gap-2 h-12 rounded-md bg-primary text-primary-foreground cursor-pointer hover:opacity-90">
              {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              {uploading ? "Uploading…" : "Choose file"}
            </div>
            <input
              id="file" type="file" className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              disabled={uploading}
            />
          </Label>
        </div>

        {/* List */}
        {docs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Your documents ({docs.length})</h4>
            {docs.map(d => (
              <div key={d.id} className="flex items-center gap-2 text-sm p-2 bg-muted/40 rounded">
                <FileText size={14} className="text-primary" />
                <span className="flex-1 truncate">{d.document_type} — {d.file_name}</span>
                <CheckCircle2 size={14} className="text-green-600" />
              </div>
            ))}
          </div>
        )}

        {/* Order missing */}
        {services.length > 0 && (
          <details className="border border-border rounded-xl p-4">
            <summary className="cursor-pointer font-semibold text-sm flex items-center gap-2">
              <ShoppingBag size={16} className="text-primary" />
              Missing a document? Order it from us
            </summary>
            <div className="mt-3 space-y-2">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-2 p-2 bg-muted/40 rounded">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">KES {Number(s.price).toLocaleString()}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => orderService(s.id)}>
                    <Plus size={12} className="mr-1" /> Order
                  </Button>
                </div>
              ))}
            </div>
          </details>
        )}

        <Button onClick={next} disabled={docs.length === 0} className="w-full">
          Continue → {docs.length === 0 && "(upload at least 1 document)"}
        </Button>
      </div>
    </StepLayout>
  );
};

export default DocumentsStep;
