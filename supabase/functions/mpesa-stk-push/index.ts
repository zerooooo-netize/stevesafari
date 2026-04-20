import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
  if (!resp.ok) {
    const text = await resp.text();
    console.error("OAuth error:", resp.status, text);
    throw new Error("Failed to obtain Kopo Kopo access token");
  }
  const data = await resp.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return cachedToken.token;
}

async function sendEmail(supabaseUrl: string, serviceKey: string, templateKey: string, to: string, data: Record<string, any>) {
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ templateKey, to, data }),
    });
  } catch (e) {
    console.error("sendEmail error:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || url.pathname.split("/").pop();

    // ---- CALLBACK ----
    if (action === "callback") {
      const body = await req.json();
      console.log("Kopo Kopo callback:", JSON.stringify(body));
      const status = body?.event?.resource?.status;
      const metadata = body?.event?.resource?.metadata;
      const paymentId = metadata?.payment_id;
      const reference = body?.event?.resource?.reference || null;

      if (paymentId) {
        const isSuccess = status === "Received" || status === "Success";
        const newStatus = isSuccess ? "completed" : "failed";

        const { data: paymentRow } = await supabase
          .from("payments")
          .update({ status: newStatus, payment_reference: reference })
          .eq("id", paymentId)
          .select("id, user_id, amount, currency, payment_type, application_id, service_order_id, is_deposit, balance_remaining, receipt_number")
          .single();

        if (isSuccess && paymentRow) {
          // Flip registration_fee_paid on profile when this is the agency registration fee
          if (paymentRow.payment_type === "registration_fee") {
            await supabase.from("profiles")
              .update({ registration_fee_paid: true })
              .eq("user_id", paymentRow.user_id);
          }
          // Update linked application status
          if (paymentRow.application_id) {
            const newAppStatus = paymentRow.is_deposit ? "deposit_paid" : "paid";
            await supabase.from("applications").update({ status: newAppStatus }).eq("id", paymentRow.application_id);
          }
          // Mark service order as paid (or half_paid based on payment_type)
          if (paymentRow.service_order_id) {
            const newOrderStatus = paymentRow.payment_type === "service_half_payment" ? "half_paid" : "paid";
            await supabase.from("service_orders").update({ status: newOrderStatus, payment_id: paymentRow.id }).eq("id", paymentRow.service_order_id);
          }
          // Send receipt email
          const { data: profile } = await supabase
            .from("profiles").select("full_name, email").eq("user_id", paymentRow.user_id).single();
          if (profile?.email) {
            const balanceLine = (paymentRow.balance_remaining && Number(paymentRow.balance_remaining) > 0)
              ? `Balance remaining: KES ${Number(paymentRow.balance_remaining).toLocaleString()}`
              : "Payment complete — no balance remaining.";
            await sendEmail(supabaseUrl, serviceKey, "payment_success", profile.email, {
              full_name: profile.full_name || "Customer",
              receipt_number: paymentRow.receipt_number || paymentId,
              amount: Number(paymentRow.amount).toLocaleString(),
              payment_type: (paymentRow.payment_type || "").replace(/_/g, " "),
              reference: reference || "—",
              date: new Date().toLocaleString(),
              balance_line: balanceLine,
            });
          }

          // ---- REFERRAL REWARD ----
          // Credit referrer when this user makes a successful application_fee payment
          if (paymentRow.payment_type === "application_fee" || paymentRow.is_deposit) {
            const { data: refRow } = await supabase
              .from("referrals")
              .select("id, referrer_id, reward_paid, status")
              .eq("referred_user_id", paymentRow.user_id)
              .maybeSingle();

            if (refRow && !refRow.reward_paid) {
              const { data: refSettings } = await supabase
                .from("settings").select("key,value")
                .in("key", ["referral_bonus_amount", "referral_enabled"]);
              const sMap = Object.fromEntries((refSettings || []).map((s: any) => [s.key, s.value]));
              const enabled = sMap.referral_enabled !== "false";
              const bonus = Number(sMap.referral_bonus_amount || 0);

              if (enabled && bonus > 0) {
                await supabase.from("referrals").update({
                  status: "rewarded",
                  reward_amount: bonus,
                  reward_currency: "KES",
                  reward_paid: true,
                  payment_id: paymentRow.id,
                }).eq("id", refRow.id);

                // Notify referrer
                const { data: refProfile } = await supabase
                  .from("profiles").select("full_name, email").eq("user_id", refRow.referrer_id).single();
                if (refProfile?.email) {
                  await sendEmail(supabaseUrl, serviceKey, "payment_success", refProfile.email, {
                    full_name: refProfile.full_name || "Customer",
                    receipt_number: `REF-${refRow.id.slice(0, 8)}`,
                    amount: bonus.toLocaleString(),
                    payment_type: "referral bonus",
                    reference: "Referral reward",
                    date: new Date().toLocaleString(),
                    balance_line: "Bonus credited to your account. Contact admin to redeem.",
                  });
                }
              }
            }
          }
        }
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- STATUS ----
    if (action === "status") {
      const paymentId = url.searchParams.get("payment_id");
      if (!paymentId) return new Response(JSON.stringify({ error: "payment_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      const { data } = await supabase.from("payments")
        .select("status, payment_reference, receipt_number").eq("id", paymentId).single();
      return new Response(JSON.stringify({
        status: data?.status || "pending",
        reference: data?.payment_reference,
        receipt_number: data?.receipt_number,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- INITIATE STK PUSH ----
    const body = await req.json();
    const { phone, amount, firstName, lastName, email, metadata, userId,
      applicationId, serviceOrderId, paymentType, description,
      isDeposit, balanceRemaining } = body;

    if (!phone || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Valid phone and amount > 0 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^\+254[17]\d{8}$/.test(phone)) {
      return new Response(JSON.stringify({ error: "Phone must be +254 format (e.g. +254712345678)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await supabase.from("settings").select("key, value")
      .in("key", ["kopokopo_client_id","kopokopo_client_secret","kopokopo_till_number","kopokopo_environment"]);
    const cfg: Record<string,string> = {};
    (settings || []).forEach((s: any) => { cfg[s.key] = s.value; });

    if (!cfg.kopokopo_client_id || !cfg.kopokopo_client_secret || !cfg.kopokopo_till_number) {
      return new Response(JSON.stringify({ error: "M-Pesa not configured. Contact admin to set up payment credentials." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = cfg.kopokopo_environment || "sandbox";
    const baseUrl = env === "live" ? "https://api.kopokopo.com" : "https://sandbox.kopokopo.com";

    const { data: payment, error: paymentError } = await supabase.from("payments").insert({
      user_id: userId,
      application_id: applicationId || null,
      service_order_id: serviceOrderId || null,
      amount,
      currency: "KES",
      payment_method: "mpesa",
      phone_number: phone,
      status: "pending",
      payment_type: paymentType || "application_fee",
      description: description || "M-Pesa Payment",
      is_deposit: !!isDeposit,
      balance_remaining: balanceRemaining || 0,
    }).select("id").single();

    if (paymentError) {
      console.error("Payment insert error:", paymentError);
      return new Response(JSON.stringify({ error: "Failed to create payment record" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getAccessToken(cfg.kopokopo_client_id, cfg.kopokopo_client_secret, env);
    const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-stk-push?action=callback`;

    const stkPayload = {
      payment_channel: "M-PESA STK Push",
      till_number: cfg.kopokopo_till_number,
      subscriber: { first_name: firstName || "", last_name: lastName || "", phone_number: phone, email: email || "" },
      amount: { currency: "KES", value: String(amount) },
      metadata: { ...metadata, payment_id: payment.id },
      _links: { callback_url: callbackUrl },
    };

    const stkResp = await fetch(`${baseUrl}/api/v1/incoming_payments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(stkPayload),
    });

    if (!stkResp.ok) {
      const errText = await stkResp.text();
      console.error("STK push error:", stkResp.status, errText, "payload:", JSON.stringify(stkPayload));
      await supabase.from("payments").update({ status: "failed", description: `STK error: ${errText.slice(0, 200)}` }).eq("id", payment.id);
      // Pass back upstream error for easier debugging in the UI/logs
      let userMsg = "Failed to initiate M-Pesa payment. Please try again.";
      try {
        const j = JSON.parse(errText);
        if (j?.error_message) userMsg = `M-Pesa: ${j.error_message}`;
        else if (j?.errors) userMsg = `M-Pesa: ${JSON.stringify(j.errors)}`;
      } catch { /* leave default */ }
      return new Response(JSON.stringify({ error: userMsg, upstream: errText.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true, paymentId: payment.id,
      message: "STK push sent! Check your phone for the M-Pesa prompt.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("mpesa-stk-push error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
