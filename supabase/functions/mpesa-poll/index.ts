// Reconciles pending Kopo Kopo payments by querying their status API.
// Designed to be invoked by pg_cron every minute. Safe to also call from a button.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(clientId: string, clientSecret: string, env: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) return cachedToken.token;
  const baseUrl = env === "live" ? "https://api.kopokopo.com" : "https://sandbox.kopokopo.com";
  const resp = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
  });
  if (!resp.ok) throw new Error(`OAuth failed: ${resp.status}`);
  const data = await resp.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return cachedToken.token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Look at pending payments older than 30s but younger than 24h
    const { data: pending, error: pendErr } = await supabase
      .from("payments")
      .select("id, payment_reference, created_at, payment_type, user_id, application_id, service_order_id, amount, is_deposit, balance_remaining, receipt_number")
      .eq("status", "pending")
      .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .lte("created_at", new Date(Date.now() - 30 * 1000).toISOString())
      .limit(50);

    if (pendErr) throw pendErr;
    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ checked: 0, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await supabase.from("settings").select("key, value")
      .in("key", ["kopokopo_client_id", "kopokopo_client_secret", "kopokopo_environment"]);
    const cfg: Record<string, string> = {};
    (settings || []).forEach((s: any) => { cfg[s.key] = s.value; });
    if (!cfg.kopokopo_client_id || !cfg.kopokopo_client_secret) {
      return new Response(JSON.stringify({ error: "Kopo Kopo not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const env = cfg.kopokopo_environment || "sandbox";
    const baseUrl = env === "live" ? "https://api.kopokopo.com" : "https://sandbox.kopokopo.com";
    const token = await getAccessToken(cfg.kopokopo_client_id, cfg.kopokopo_client_secret, env);

    let updated = 0;
    for (const p of pending) {
      if (!p.payment_reference) continue; // No upstream reference yet — skip
      try {
        const r = await fetch(`${baseUrl}/api/v1/incoming_payments/${p.payment_reference}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (!r.ok) continue;
        const j = await r.json();
        const status = j?.data?.attributes?.status;
        if (!status) continue;

        const isSuccess = status === "Received" || status === "Success";
        const isFailed = status === "Failed" || status === "Cancelled";
        if (!isSuccess && !isFailed) continue;

        await supabase.from("payments")
          .update({ status: isSuccess ? "completed" : "failed" })
          .eq("id", p.id);

        if (isSuccess) {
          if (p.payment_type === "registration_fee") {
            await supabase.from("profiles").update({ registration_fee_paid: true }).eq("user_id", p.user_id);
          }
          if (p.application_id) {
            await supabase.from("applications").update({
              status: p.is_deposit ? "deposit_paid" : "paid"
            }).eq("id", p.application_id);
          }
          if (p.service_order_id) {
            await supabase.from("service_orders").update({ status: "paid", payment_id: p.id }).eq("id", p.service_order_id);
          }
        }
        updated++;
      } catch (e) {
        console.error(`Reconcile failed for ${p.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ checked: pending.length, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mpesa-poll error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
