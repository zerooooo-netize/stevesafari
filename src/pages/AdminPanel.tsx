import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Briefcase, Users, CreditCard, FileText, Settings, Plane, ShoppingBag,
  Plus, Pencil, Trash2, ArrowLeft, X, Eye, Check, XCircle
} from "lucide-react";

type Tab = "jobs" | "services" | "applications" | "users" | "payments" | "batches" | "settings";

const AdminPanel = () => {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("jobs");

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "jobs", label: "Jobs", icon: Briefcase },
    { key: "services", label: "Services", icon: ShoppingBag },
    { key: "applications", label: "Applications", icon: FileText },
    { key: "users", label: "Users", icon: Users },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "batches", label: "Travel Batches", icon: Plane },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3 px-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-heading font-bold text-lg">
              Steve <span className="text-safari-gold">Safari</span>
            </Link>
            <span className="text-xs bg-safari-gold/20 text-safari-gold px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-primary-foreground" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="ghost" size="sm" className="text-primary-foreground" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Tab nav */}
        <div className="flex gap-1 overflow-x-auto pb-4 mb-6 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {activeTab === "jobs" && <AdminJobs />}
        {activeTab === "services" && <AdminServices />}
        {activeTab === "applications" && <AdminApplications />}
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "payments" && <AdminPayments />}
        {activeTab === "batches" && <AdminBatches />}
        {activeTab === "settings" && <AdminSettings />}
      </div>
    </div>
  );
};

// ========================= JOBS =========================
const AdminJobs = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ title: "", country: "Canada", city: "", description: "", requirements: "", salary: "", currency: "CAD", job_type: "Full-Time", application_fee: "0", slots_available: "0", deadline: "", is_active: true });

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    setJobs(data || []);
  };

  const resetForm = () => { setForm({ title: "", country: "Canada", city: "", description: "", requirements: "", salary: "", currency: "CAD", job_type: "Full-Time", application_fee: "0", slots_available: "0", deadline: "", is_active: true }); setEditing(null); };

  const save = async () => {
    const payload = { ...form, application_fee: parseFloat(form.application_fee) || 0, slots_available: parseInt(form.slots_available) || 0, deadline: form.deadline || null };
    if (editing) {
      const { error } = await supabase.from("jobs").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Job updated!");
    } else {
      const { error } = await supabase.from("jobs").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Job created!");
    }
    resetForm();
    loadJobs();
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    toast.success("Deleted");
    loadJobs();
  };

  const startEdit = (job: any) => {
    setEditing(job);
    setForm({ title: job.title, country: job.country, city: job.city || "", description: job.description || "", requirements: job.requirements || "", salary: job.salary || "", currency: job.currency, job_type: job.job_type, application_fee: String(job.application_fee), slots_available: String(job.slots_available), deadline: job.deadline || "", is_active: job.is_active });
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-4">{editing ? "Edit Job" : "Create Job"}</h2>
      <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-card">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Farm Worker" /></div>
          <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
          <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
          <div><Label>Salary</Label><Input value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="CAD 3,200/mo" /></div>
          <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} /></div>
          <div><Label>Job Type</Label><Input value={form.job_type} onChange={e => setForm({ ...form, job_type: e.target.value })} /></div>
          <div><Label>Application Fee (KES)</Label><Input type="number" value={form.application_fee} onChange={e => setForm({ ...form, application_fee: e.target.value })} /></div>
          <div><Label>Slots Available</Label><Input type="number" value={form.slots_available} onChange={e => setForm({ ...form, slots_available: e.target.value })} /></div>
          <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
          <div className="sm:col-span-2 lg:col-span-3"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="sm:col-span-2 lg:col-span-3"><Label>Requirements</Label><Textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} rows={2} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} id="active" />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save}>{editing ? "Update Job" : "Create Job"}</Button>
          {editing && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
        </div>
      </div>

      <h3 className="font-heading font-semibold mb-3">All Jobs ({jobs.length})</h3>
      <div className="space-y-3">
        {jobs.map(job => (
          <div key={job.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{job.title}</h4>
              <p className="text-sm text-muted-foreground">{job.country} • {job.salary} • {job.is_active ? "Active" : "Inactive"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => startEdit(job)}><Pencil size={16} /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteJob(job.id)}><Trash2 size={16} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========================= SERVICES =========================
const AdminServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "0", currency: "KES", icon: "", is_active: true });

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await supabase.from("services").select("*").order("created_at", { ascending: false }); setServices(data || []); };
  const resetForm = () => { setForm({ name: "", description: "", price: "0", currency: "KES", icon: "", is_active: true }); setEditing(null); };

  const save = async () => {
    const payload = { ...form, price: parseFloat(form.price) || 0 };
    if (editing) {
      const { error } = await supabase.from("services").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Updated!");
    } else {
      const { error } = await supabase.from("services").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Created!");
    }
    resetForm(); load();
  };

  const del = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("services").delete().eq("id", id); load(); };

  const startEdit = (s: any) => { setEditing(s); setForm({ name: s.name, description: s.description || "", price: String(s.price), currency: s.currency, icon: s.icon || "", is_active: s.is_active }); };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-4">{editing ? "Edit Service" : "Create Service"}</h2>
      <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-card">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="CV Rewrite" /></div>
          <div><Label>Price</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
          <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} /></div>
          <div><Label>Icon (lucide name)</Label><Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="file-text" /></div>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} id="svc-active" /><Label htmlFor="svc-active">Active</Label></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save}>{editing ? "Update" : "Create"}</Button>
          {editing && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
        </div>
      </div>
      <div className="space-y-3">
        {services.map(s => (
          <div key={s.id} className="bg-card border border-border rounded-lg p-4 flex justify-between items-center">
            <div><h4 className="font-semibold">{s.name}</h4><p className="text-sm text-muted-foreground">{s.currency} {Number(s.price).toLocaleString()}</p></div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => startEdit(s)}><Pencil size={16} /></Button>
              <Button variant="ghost" size="icon" onClick={() => del(s.id)}><Trash2 size={16} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========================= APPLICATIONS =========================
const AdminApplications = () => {
  const [apps, setApps] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => { load(); loadBatches(); }, []);
  const load = async () => { const { data } = await supabase.from("applications").select("*, profiles:user_id(full_name, email, phone), jobs(title, country)").order("created_at", { ascending: false }); setApps(data || []); };
  const loadBatches = async () => { const { data } = await supabase.from("travel_batches").select("*").eq("status", "upcoming"); setBatches(data || []); };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Status updated!"); load(); }
  };

  const assignBatch = async (appId: string, batchId: string) => {
    const { error } = await supabase.from("batch_assignments").insert({ application_id: appId, batch_id: batchId });
    if (error) toast.error(error.message); else { await updateStatus(appId, "batch_assigned"); }
  };

  const statuses = ["registered", "paid", "documents_submitted", "verified", "batch_assigned", "completed", "rejected"];

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-4">Applications ({apps.length})</h2>
      <div className="space-y-3">
        {apps.map(a => (
          <div key={a.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h4 className="font-semibold">{(a.profiles as any)?.full_name || "Unknown"}</h4>
                <p className="text-sm text-muted-foreground">{(a.profiles as any)?.email} • {(a.jobs as any)?.title} ({(a.jobs as any)?.country})</p>
              </div>
              <select
                value={a.status}
                onChange={e => updateStatus(a.id, e.target.value)}
                className="text-sm border border-border rounded px-2 py-1 bg-background"
              >
                {statuses.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            {a.status === "verified" && batches.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Assign to batch:</span>
                {batches.map(b => (
                  <Button key={b.id} variant="outline" size="sm" onClick={() => assignBatch(a.id, b.id)}>{b.name}</Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ========================= USERS =========================
const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false }); setUsers(data || []); };

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (isCurrentlyAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    }
    toast.success("Role updated!");
    load();
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-4">Users ({users.length})</h2>
      <div className="space-y-3">
        {users.map(u => {
          const roles = (u.user_roles as any[]) || [];
          const isAdmin = roles.some((r: any) => r.role === "admin");
          return (
            <div key={u.id} className="bg-card border border-border rounded-lg p-4 flex justify-between items-center">
              <div>
                <h4 className="font-semibold">{u.full_name || "—"}</h4>
                <p className="text-sm text-muted-foreground">{u.email} • {u.phone || "No phone"}</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && <span className="text-xs bg-safari-gold/20 text-safari-gold px-2 py-0.5 rounded-full">Admin</span>}
                <Button variant="outline" size="sm" onClick={() => toggleAdmin(u.user_id, isAdmin)}>
                  {isAdmin ? "Remove Admin" : "Make Admin"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ========================= PAYMENTS =========================
const AdminPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await supabase.from("payments").select("*, profiles:user_id(full_name, email)").order("created_at", { ascending: false }); setPayments(data || []); };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("payments").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated!"); load(); }
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-4">Payments ({payments.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2">User</th><th>Amount</th><th>Type</th><th>Method</th><th>Status</th></tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2">{(p.profiles as any)?.full_name || "—"}</td>
                <td className="font-medium">{p.currency} {Number(p.amount).toLocaleString()}</td>
                <td className="capitalize">{p.payment_type?.replace("_", " ")}</td>
                <td>{p.payment_method}</td>
                <td>
                  <select value={p.status} onChange={e => updateStatus(p.id, e.target.value)} className="text-xs border border-border rounded px-1 py-0.5 bg-background">
                    {["pending", "completed", "failed", "refunded"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ========================= TRAVEL BATCHES =========================
const AdminBatches = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", destination: "Canada", travel_date: "", accommodation_fee: "0", travel_fee: "0", currency: "KES", status: "upcoming", notes: "" });

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await supabase.from("travel_batches").select("*").order("travel_date", { ascending: true }); setBatches(data || []); };
  const resetForm = () => { setForm({ name: "", destination: "Canada", travel_date: "", accommodation_fee: "0", travel_fee: "0", currency: "KES", status: "upcoming", notes: "" }); setEditing(null); };

  const save = async () => {
    const payload = { ...form, accommodation_fee: parseFloat(form.accommodation_fee) || 0, travel_fee: parseFloat(form.travel_fee) || 0, travel_date: form.travel_date || null };
    if (editing) {
      await supabase.from("travel_batches").update(payload).eq("id", editing.id);
      toast.success("Updated!");
    } else {
      await supabase.from("travel_batches").insert(payload);
      toast.success("Created!");
    }
    resetForm(); load();
  };

  const startEdit = (b: any) => { setEditing(b); setForm({ name: b.name, destination: b.destination, travel_date: b.travel_date || "", accommodation_fee: String(b.accommodation_fee), travel_fee: String(b.travel_fee), currency: b.currency, status: b.status, notes: b.notes || "" }); };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-4">{editing ? "Edit Batch" : "Create Batch"}</h2>
      <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-card">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Batch March 2026" /></div>
          <div><Label>Destination</Label><Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} /></div>
          <div><Label>Travel Date</Label><Input type="date" value={form.travel_date} onChange={e => setForm({ ...form, travel_date: e.target.value })} /></div>
          <div><Label>Travel Fee</Label><Input type="number" value={form.travel_fee} onChange={e => setForm({ ...form, travel_fee: e.target.value })} /></div>
          <div><Label>Accommodation Fee</Label><Input type="number" value={form.accommodation_fee} onChange={e => setForm({ ...form, accommodation_fee: e.target.value })} /></div>
          <div><Label>Status</Label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm">
              {["upcoming", "in_progress", "completed", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save}>{editing ? "Update" : "Create"}</Button>
          {editing && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
        </div>
      </div>
      <div className="space-y-3">
        {batches.map(b => (
          <div key={b.id} className="bg-card border border-border rounded-lg p-4 flex justify-between items-center">
            <div><h4 className="font-semibold">{b.name}</h4><p className="text-sm text-muted-foreground">{b.destination} • {b.travel_date || "TBD"} • {b.status}</p></div>
            <Button variant="ghost" size="icon" onClick={() => startEdit(b)}><Pencil size={16} /></Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========================= SETTINGS =========================
const AdminSettings = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("settings").select("*").order("key");
    setSettings(data || []);
    const vals: Record<string, string> = {};
    (data || []).forEach((s: any) => { vals[s.key] = s.value; });
    setEditValues(vals);
  };

  const saveSetting = async (key: string) => {
    const { error } = await supabase.from("settings").update({ value: editValues[key] }).eq("key", key);
    if (error) toast.error(error.message); else toast.success(`${key} updated!`);
  };

  const groupedSettings = {
    "Fees & Pricing": settings.filter(s => ["registration_fee", "deposit_amount", "allow_deposits"].includes(s.key)),
    "Kopo Kopo (M-Pesa)": settings.filter(s => s.key.startsWith("kopokopo")),
    "Email / SMTP": settings.filter(s => ["smtp_host", "smtp_port", "smtp_user", "smtp_password", "sender_email"].includes(s.key)),
    "Company Info": settings.filter(s => ["company_name", "company_phone", "whatsapp_number"].includes(s.key)),
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-4">Platform Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">Configure fees, API keys, and integrations. Changes take effect immediately.</p>
      {Object.entries(groupedSettings).map(([group, items]) => (
        <div key={group} className="bg-card border border-border rounded-lg p-6 mb-6 shadow-card">
          <h3 className="font-heading font-semibold mb-4">{group}</h3>
          <div className="space-y-4">
            {items.map(s => (
              <div key={s.key} className="flex items-end gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">{s.description || s.key}</Label>
                  <Input
                    type={s.is_secret ? "password" : "text"}
                    value={editValues[s.key] || ""}
                    onChange={e => setEditValues({ ...editValues, [s.key]: e.target.value })}
                  />
                </div>
                <Button size="sm" onClick={() => saveSetting(s.key)}>Save</Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminPanel;
