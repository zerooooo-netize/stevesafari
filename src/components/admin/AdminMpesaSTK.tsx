import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, RefreshCcw, Zap, Copy, CheckCircle2, XCircle, Clock } from "lucide-react";

type Payment = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  phone_number: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  status: string;
  payment_type: string | null;
  description: string | null;
  receipt_number: string | null;
  created_at: string;
  profiles?: { full_name?: string; email?: string } | null;
};

const statusBadge = (s: string) => {
  const map: Record<string, { cls: string; Icon: any }> = {
    completed: { cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300", Icon: CheckCircle2 },
    failed:    { cls: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", Icon: XCircle },
    pending:   { cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", Icon: Clock },
    refunded:  { cls: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200", Icon: RefreshCcw },
  };
  const { cls, Icon } = map[s] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Icon size={12} />{s}
    </span>
  );
};

const AdminMpesaSTK = () => {
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "failed">("all");
  const [search, setSearch] = useState("");
  const [lastPoll, setLastPoll] = useState<{ checked: number; updated: number } | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("payments")
      .select("*, profiles:user_id(full_name, email)")
      .eq("payment_method", "mpesa")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const runPolling = async () => {
    setPolling(true);
    try {
      const { data, error } = await supabase.functions.invoke("mpesa-poll", { body: {} });
      if (error) throw error;
      setLastPoll({ checked: data?.checked ?? 0, updated: data?.updated ?? 0 });
      toast.success(`Polled K2: ${data?.checked ?? 0} checked, ${data?.updated ?? 0} updated`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Polling failed");
    } finally {
      setPolling(false);
    }
  };

  const copy = (t: string | null) => {
    if (!t) return;
    navigator.clipboard.writeText(t);
    toast.success("Copied");
  };

  const visible = rows.filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      r.phone_number?.toLowerCase().includes(s) ||
      r.payment_reference?.toLowerCase().includes(s) ||
      r.receipt_number?.toLowerCase().includes(s) ||
      r.profiles?.email?.toLowerCase().includes(s) ||
      r.profiles?.full_name?.toLowerCase().includes(s)
    );
  });

  const counts = {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    completed: rows.filter((r) => r.status === "completed").length,
    failed: rows.filter((r) => r.status === "failed").length,
  };

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="font-heading text-xl font-bold">M-Pesa STK Push & K2 Polling</h2>
          <p className="text-sm text-muted-foreground mt-1">
            All STK push requests sent to Kopo Kopo and their current polling status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <RefreshCcw size={14} className="mr-1" />}
            Refresh
          </Button>
          <Button size="sm" onClick={runPolling} disabled={polling}>
            {polling ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Zap size={14} className="mr-1" />}
            Run K2 Polling Now
          </Button>
        </div>
      </div>

      {lastPoll && (
        <div className="mb-4 text-xs bg-muted/50 border border-border rounded-md px-3 py-2 inline-block">
          Last poll: <strong>{lastPoll.checked}</strong> checked · <strong>{lastPoll.updated}</strong> updated
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { k: "all" as const, label: "Total", val: counts.total },
          { k: "pending" as const, label: "Pending", val: counts.pending },
          { k: "completed" as const, label: "Completed", val: counts.completed },
          { k: "failed" as const, label: "Failed", val: counts.failed },
        ].map((c) => (
          <button
            key={c.k}
            onClick={() => setFilter(c.k)}
            className={`text-left bg-card border rounded-lg p-3 transition-colors ${
              filter === c.k ? "border-primary ring-1 ring-primary" : "border-border hover:border-muted-foreground/40"
            }`}
          >
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className="text-2xl font-bold font-heading">{c.val}</div>
          </button>
        ))}
      </div>

      <Input
        placeholder="Search by phone, K2 reference, receipt, name, email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-md"
      />

      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">K2 Reference</th>
              <th className="px-3 py-2">Receipt</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                  {loading ? "Loading…" : "No STK push requests found."}
                </td>
              </tr>
            )}
            {visible.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-3 py-2 whitespace-nowrap">
                  <div>{new Date(p.created_at).toLocaleDateString()}</div>
                  <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleTimeString()}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium truncate max-w-[160px]">{p.profiles?.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[160px]">{p.profiles?.email}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{p.phone_number || "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap font-medium">
                  {p.currency} {Number(p.amount).toLocaleString()}
                </td>
                <td className="px-3 py-2 whitespace-nowrap capitalize">
                  {p.payment_type?.replace(/_/g, " ") || "—"}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {p.payment_reference ? (
                    <button onClick={() => copy(p.payment_reference)} className="inline-flex items-center gap-1 hover:text-primary">
                      <span className="truncate max-w-[140px] inline-block align-bottom">{p.payment_reference}</span>
                      <Copy size={12} />
                    </button>
                  ) : <span className="text-muted-foreground">none</span>}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{p.receipt_number || "—"}</td>
                <td className="px-3 py-2">{statusBadge(p.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMpesaSTK;
