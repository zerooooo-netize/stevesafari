import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Copy, Link as LinkIcon } from "lucide-react";

const empty = {
 code: "",
 description: "",
 discount_type: "fixed",
 discount_value: "0",
 max_uses: "",
 applies_to: "application_fee",
 expires_at: "",
 is_active: true,
};

const AdminDiscountCodes = () =>{
 const [codes, setCodes] = useState<any[]>([]);
 const [editing, setEditing] = useState<any | null>(null);

 const load = async () =>{
 const { data } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
 setCodes(data || []);
 };
 useEffect(() =>{
 load();
 }, []);

 const save = async () =>{
 if (!editing.code?.trim()) {
 toast.error("Code is required");
 return;
 }
 const payload: any = {
 code: editing.code.trim().toUpperCase(),
 description: editing.description || null,
 discount_type: editing.discount_type,
 discount_value: parseFloat(editing.discount_value) || 0,
 applies_to: editing.applies_to,
 max_uses: editing.max_uses ? parseInt(editing.max_uses) : null,
 expires_at: editing.expires_at || null,
 is_active: editing.is_active,
 };
 if (editing.id) {
 const { error } = await supabase.from("discount_codes").update(payload).eq("id", editing.id);
 if (error) return toast.error(error.message);
 } else {
 const { error } = await supabase.from("discount_codes").insert(payload);
 if (error) return toast.error(error.message);
 }
 toast.success("Saved");
 setEditing(null);
 load();
 };

 const remove = async (id: string) =>{
 if (!confirm("Delete this code?")) return;
 await supabase.from("discount_codes").delete().eq("id", id);
 load();
 };

 const copyLink = (code: string) =>{
 const link = `${window.location.origin}/auth?promo=${code}`;
 navigator.clipboard.writeText(link);
 toast.success("Discount link copied!");
 };

 return (
<div className="space-y-4">
<div className="flex items-center justify-between">
<div>
<h2 className="font-heading text-xl font-bold">Discount Codes</h2>
<p className="text-xs text-muted-foreground">
 Create custom promo codes. Share links or have users enter them at checkout.
</p>
</div>
<Button size="sm" onClick={() =>setEditing({ ...empty })}>
<Plus size={16} />New Code
</Button>
</div>

 {editing && (
<div className="bg-card border border-border rounded-lg p-4 space-y-3">
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
<div>
<Label>Code *</Label>
<Input
 value={editing.code}
 onChange={(e) =>setEditing({ ...editing, code: e.target.value.toUpperCase() })}
 placeholder="EARLYBIRD2000"
 />
</div>
<div>
<Label>Description</Label>
<Input
 value={editing.description}
 onChange={(e) =>setEditing({ ...editing, description: e.target.value })}
 placeholder="Early bird discount"
 />
</div>
<div>
<Label>Type</Label>
<select
 value={editing.discount_type}
 onChange={(e) =>setEditing({ ...editing, discount_type: e.target.value })}
 className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm"
 >
<option value="fixed">Fixed amount (KES)</option>
<option value="percent">Percent (%)</option>
</select>
</div>
<div>
<Label>Value</Label>
<Input
 type="number"
 value={editing.discount_value}
 onChange={(e) =>setEditing({ ...editing, discount_value: e.target.value })}
 />
</div>
<div>
<Label>Applies To</Label>
<select
 value={editing.applies_to}
 onChange={(e) =>setEditing({ ...editing, applies_to: e.target.value })}
 className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm"
 >
<option value="application_fee">Application fee</option>
<option value="service">Service payment</option>
<option value="any">Any payment</option>
</select>
</div>
<div>
<Label>Max Uses (blank = unlimited)</Label>
<Input
 type="number"
 value={editing.max_uses}
 onChange={(e) =>setEditing({ ...editing, max_uses: e.target.value })}
 />
</div>
<div>
<Label>Expires (optional)</Label>
<Input
 type="datetime-local"
 value={editing.expires_at?.slice(0, 16) || ""}
 onChange={(e) =>setEditing({ ...editing, expires_at: e.target.value })}
 />
</div>
<label className="flex items-center gap-2 text-sm mt-6">
<input
 type="checkbox"
 checked={editing.is_active}
 onChange={(e) =>setEditing({ ...editing, is_active: e.target.checked })}
 />
 Active
</label>
</div>
<div className="flex gap-2">
<Button onClick={save}>Save</Button>
<Button variant="outline" onClick={() =>setEditing(null)}>
 Cancel
</Button>
</div>
</div>
 )}

<div className="overflow-x-auto bg-card border border-border rounded-lg">
<table className="w-full text-sm">
<thead className="bg-muted text-xs uppercase">
<tr>
<th className="p-3 text-left">Code</th>
<th className="p-3">Discount</th>
<th className="p-3">Applies</th>
<th className="p-3">Used</th>
<th className="p-3">Expires</th>
<th className="p-3">Status</th>
<th className="p-3"></th>
</tr>
</thead>
<tbody>
 {codes.map((c) =>(
<tr key={c.id} className="border-t border-border">
<td className="p-3 font-mono font-semibold">{c.code}</td>
<td className="p-3 text-center">
 {c.discount_type === "fixed"
 ? `KES ${Number(c.discount_value).toLocaleString()}`
 : `${c.discount_value}%`}
</td>
<td className="p-3 text-center text-xs">{c.applies_to.replace("_", " ")}</td>
<td className="p-3 text-center">
 {c.uses_count}
 {c.max_uses ? ` / ${c.max_uses}` : ""}
</td>
<td className="p-3 text-center text-xs">
 {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "-"}
</td>
<td className="p-3 text-center">
<span
 className={`text-xs px-2 py-0.5 rounded-full ${
 c.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
 }`}
 >
 {c.is_active ? "active" : "off"}
</span>
</td>
<td className="p-3">
<div className="flex gap-1">
<Button size="icon" variant="ghost" onClick={() =>copyLink(c.code)} title="Copy share link">
<LinkIcon size={14} />
</Button>
<Button size="icon" variant="ghost" onClick={() =>setEditing(c)}>
<Pencil size={14} />
</Button>
<Button size="icon" variant="ghost" onClick={() =>remove(c.id)}>
<Trash2 size={14} />
</Button>
</div>
</td>
</tr>
 ))}
 {codes.length === 0 && (
<tr>
<td colSpan={7} className="p-6 text-center text-muted-foreground">
 No discount codes yet. Create one above.
</td>
</tr>
 )}
</tbody>
</table>
</div>
</div>
 );
};

export default AdminDiscountCodes;
