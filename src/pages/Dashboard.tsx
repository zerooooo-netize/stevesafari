import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, FileText, CreditCard, Plane, LogOut, Settings } from "lucide-react";

const statusSteps = ["registered", "paid", "documents_submitted", "verified", "batch_assigned", "completed"];
const statusLabels: Record<string, string> = {
  registered: "Registered",
  paid: "Paid",
  documents_submitted: "Docs Submitted",
  verified: "Verified",
  batch_assigned: "Batch Assigned",
  completed: "Completed",
  rejected: "Rejected",
};

const Dashboard = () => {
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", id_number: "", passport_number: "" });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        id_number: profile.id_number || "",
        passport_number: profile.passport_number || "",
      });
    }
  }, [profile]);

  const loadData = async () => {
    const [appsRes, paysRes] = await Promise.all([
      supabase.from("applications").select("*, jobs(title, country, salary)").eq("user_id", user!.id),
      supabase.from("payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setApplications(appsRes.data || []);
    setPayments(paysRes.data || []);
  };

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update(form).eq("user_id", user!.id);
    if (error) { toast.error("Failed to update profile"); return; }
    toast.success("Profile updated!");
    setEditing(false);
    refreshProfile();
  };

  const getProgressIndex = (status: string) => {
    const idx = statusSteps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12 container max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Welcome, {profile?.full_name || "User"}
            </h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                <Settings size={16} /> Admin Panel
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={16} /> Sign Out
            </Button>
          </div>
        </div>

        {/* Profile Section */}
        <section className="bg-card border border-border rounded-lg p-6 mb-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold flex items-center gap-2"><User size={18} /> Profile</h2>
            <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel" : "Edit"}
            </Button>
          </div>
          {editing ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254..." /></div>
              <div><Label>ID Number</Label><Input value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })} /></div>
              <div><Label>Passport Number</Label><Input value={form.passport_number} onChange={e => setForm({ ...form, passport_number: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <Button onClick={saveProfile} className="sm:col-span-2">Save Profile</Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {profile?.full_name || "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {profile?.phone || "—"}</div>
              <div><span className="text-muted-foreground">ID:</span> {profile?.id_number || "—"}</div>
              <div><span className="text-muted-foreground">Passport:</span> {profile?.passport_number || "—"}</div>
              <div><span className="text-muted-foreground">Address:</span> {profile?.address || "—"}</div>
            </div>
          )}
        </section>

        {/* Applications */}
        <section className="bg-card border border-border rounded-lg p-6 mb-6 shadow-card">
          <h2 className="font-heading font-semibold flex items-center gap-2 mb-4"><FileText size={18} /> My Applications</h2>
          {applications.length === 0 ? (
            <p className="text-muted-foreground text-sm">No applications yet. <Link to="/jobs" className="text-safari-gold hover:underline">Browse Jobs</Link></p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{app.jobs?.title}</h3>
                      <p className="text-sm text-muted-foreground">{app.jobs?.country} • {app.jobs?.salary}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${app.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-safari-gold/10 text-safari-gold'}`}>
                      {statusLabels[app.status] || app.status}
                    </span>
                  </div>
                  {/* Progress bar */}
                  {app.status !== "rejected" && (
                    <div className="flex gap-1">
                      {statusSteps.map((step, i) => (
                        <div
                          key={step}
                          className={`h-2 flex-1 rounded-full ${i <= getProgressIndex(app.status) ? 'bg-safari-gold' : 'bg-muted'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Payments */}
        <section className="bg-card border border-border rounded-lg p-6 shadow-card">
          <h2 className="font-heading font-semibold flex items-center gap-2 mb-4"><CreditCard size={18} /> Payment History</h2>
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2">Date</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border">
                      <td className="py-2">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="font-medium">{p.currency} {Number(p.amount).toLocaleString()}</td>
                      <td className="capitalize">{p.payment_type?.replace("_", " ")}</td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
