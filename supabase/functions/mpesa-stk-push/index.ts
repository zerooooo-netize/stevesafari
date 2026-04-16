import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(clientId: string, clientSecret: string, env: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const baseUrl = env === "live"
    ? "https://api.kopokopo.com"
    : "https://sandbox.kopokopo.com";

  const resp = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("OAuth error:", resp.status, text);
    throw new Error("Failed to obtain Kopo Kopo access token");
  }

  const data = await resp.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return cachedToken.token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // ---- CALLBACK from Kopo Kopo ----
    if (path === "callback" || url.searchParams.get("action") === "callback") {
      const body = await req.json();
      console.log("Kopo Kopo callback:", JSON.stringify(body));

      const topic = body?.topic;
      const status = body?.event?.resource?.status;
      const metadata = body?.event?.resource?.metadata;
      const paymentId = metadata?.payment_id;

      if (paymentId) {
        const newStatus = status === "Received" || status === "Success" ? "completed" : "failed";
        await supabase
          .from("payments")
          .update({
            status: newStatus,
            payment_reference: body?.event?.resource?.reference || null,
          })
          .eq("id", paymentId);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- STATUS CHECK ----
    if (path === "status" || url.searchParams.get("action") === "status") {
      const paymentId = url.searchParams.get("payment_id");
      if (!paymentId) {
        return new Response(JSON.stringify({ error: "payment_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data } = await supabase
        .from("payments")
        .select("status, payment_reference")
        .eq("id", paymentId)
        .single();

      return new Response(JSON.stringify({ status: data?.status || "pending", reference: data?.payment_reference }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- INITIATE STK PUSH ----
    const body = await req.json();
    const { phone, amount, firstName, lastName, email, metadata, userId, applicationId, serviceOrderId, paymentType, description } = body;

    // Validate
    if (!phone || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Valid phone and amount > 0 required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phoneRegex = /^\+254[17]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(JSON.stringify({ error: "Phone must be +254 format (e.g. +254712345678)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Kopo Kopo settings from DB
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["kopokopo_client_id", "kopokopo_client_secret", "kopokopo_till_number", "kopokopo_environment"]);

    const cfg: Record<string, string> = {};
    (settings || []).forEach((s: any) => { cfg[s.key] = s.value; });

    if (!cfg.kopokopo_client_id || !cfg.kopokopo_client_secret || !cfg.kopokopo_till_number) {
      return new Response(JSON.stringify({ error: "Kopo Kopo credentials not configured. Contact admin." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = cfg.kopokopo_environment || "sandbox";
    const baseUrl = env === "live"
      ? "https://api.kopokopo.com"
      : "https://sandbox.kopokopo.com";

    // Create payment record first
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
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
      })
      .select("id")
      .single();

    if (paymentError) {
      console.error("Payment insert error:", paymentError);
      return new Response(JSON.stringify({ error: "Failed to create payment record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get access token
    const token = await getAccessToken(cfg.kopokopo_client_id, cfg.kopokopo_client_secret, env);

    // Build callback URL
    const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-stk-push?action=callback`;

    // Initiate STK push
    const stkPayload = {
      payment_channel: "M-PESA STK Push",
      till_number: cfg.kopokopo_till_number,
      subscriber: {
        first_name: firstName || "",
        last_name: lastName || "",
        phone_number: phone,
        email: email || "",
      },
      amount: {
        currency: "KES",
        value: String(amount),
      },
      metadata: {
        ...metadata,
        payment_id: payment.id,
      },
      _links: {
        callback_url: callbackUrl,
      },
    };

    const stkResp = await fetch(`${baseUrl}/api/v1/incoming_payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    if (!stkResp.ok) {
      const errText = await stkResp.text();
      console.error("STK push error:", stkResp.status, errText);
      await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id);
      return new Response(JSON.stringify({ error: "Failed to initiate M-Pesa payment. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stkResult = await stkResp.json();
    console.log("STK push success:", JSON.stringify(stkResult));

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        message: "STK push sent! Check your phone for the M-Pesa prompt.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("mpesa-stk-push error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
