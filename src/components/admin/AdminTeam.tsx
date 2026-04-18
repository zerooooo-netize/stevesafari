import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";

const empty = {
  full_name: "",
  role: "",
  bio: "",
  photo_url: "",
  display_order: 0,
  is_active: true,
};

const AdminTeam = () => {
  const [team, setTeam] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("team_members").select("*").order("display_order");
    setTeam(data || []);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing.full_name || !editing.role) {
      toast.error("Name and role are required");
      return;
    }
    const payload = { ...editing };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    if (editing.id) {
      const { error } = await supabase.from("team_members").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("team_members").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this team member?")) return;
    await supabase.from("team_members").delete().eq("id", id);
    load();
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("team-photos").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("team-photos").getPublicUrl(path);
    setEditing({ ...editing, photo_url: data.publicUrl });
    setUploading(false);
    toast.success("Photo uploaded");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Team Members</h2>
          <p className="text-xs text-muted-foreground">Real humans behind your platform — shown on the homepage.</p>
        </div>
        <Button size="sm" onClick={() => setEditing({ ...empty })}>
          <Plus size={16} /> Add Member
        </Button>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Full Name *</Label>
              <Input value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Role *</Label>
              <Input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} placeholder="Founder & CEO" />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} />
            </div>
            <label className="flex items-center gap-2 text-sm mt-6">
              <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              Active
            </label>
            <div className="md:col-span-2">
              <Label>Bio</Label>
              <Textarea rows={2} value={editing.bio || ""} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Photo</Label>
              <div className="flex items-center gap-3">
                {editing.photo_url && <img src={editing.photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />}
                <input type="file" accept="image/*" onChange={uploadPhoto} disabled={uploading} className="text-sm" />
                {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
              </div>
              <Input className="mt-2" placeholder="Or paste image URL" value={editing.photo_url || ""} onChange={(e) => setEditing({ ...editing, photo_url: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save}>💾 Save</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {team.map((m) => (
          <div key={m.id} className="bg-card border border-border rounded-lg p-4 flex gap-3">
            {m.photo_url ? (
              <img src={m.photo_url} alt={m.full_name} className="w-14 h-14 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold">
                {m.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{m.full_name}</p>
                {!m.is_active && <span className="text-xs text-muted-foreground">(hidden)</span>}
              </div>
              <p className="text-xs text-safari-gold">{m.role}</p>
              {m.bio && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{m.bio}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditing(m)}><Pencil size={14} /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
        {team.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-6">No team members yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminTeam;
