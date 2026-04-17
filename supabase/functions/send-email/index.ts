import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function renderTemplate(tpl: string, data: Record<string, any>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    data[k] !== undefined && data[k] !== null ? String(data[k]) : ""
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { templateKey, to, data } = await req.json();
    if (!templateKey || !to) {
      return new Response(JSON.stringify({ error: "templateKey and to required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch template
    const { data: tpl, error: tplErr } = await supabase
      .from("email_templates").select("subject, body").eq("template_key", templateKey).single();
    if (tplErr || !tpl) {
      return new Response(JSON.stringify({ error: `Template '${templateKey}' not found` }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch SMTP settings
    const { data: settingsRows } = await supabase
      .from("settings").select("key, value")
      .in("key", ["smtp_host","smtp_port","smtp_user","smtp_password","smtp_from_email","smtp_from_name","sender_email"]);
    const cfg: Record<string,string> = {};
    (settingsRows || []).forEach((s: any) => { cfg[s.key] = s.value; });

    if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_password) {
      console.warn("SMTP not configured — skipping email send", { templateKey, to });
      return new Response(JSON.stringify({ skipped: true, reason: "SMTP not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = renderTemplate(tpl.subject, data || {});
    const bodyText = renderTemplate(tpl.body, data || {});
    const bodyHtml = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">${
      bodyText.replace(/\n/g,"<br/>")
    }</div>`;

    const fromEmail = cfg.smtp_from_email || cfg.sender_email || cfg.smtp_user;
    const fromName = cfg.smtp_from_name || "Steve Safari Agency";
    const port = parseInt(cfg.smtp_port || "587");

    const client = new SMTPClient({
      connection: {
        hostname: cfg.smtp_host,
        port,
        tls: port === 465,
        auth: { username: cfg.smtp_user, password: cfg.smtp_password },
      },
    });

    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      content: bodyText,
      html: bodyHtml,
    });
    await client.close();

    console.log("Email sent", { templateKey, to, subject });
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
