// Paystack webhook receiver
// - Verifies HMAC-SHA512 of the raw body using the secret key stored in site_settings
// - On charge.success: marks the matching event_registration as paid
// - Logs every attempt (good and bad) to webhook_logs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const log = async (
    status: string,
    message: string,
    signatureValid: boolean,
    eventType: string | null,
    payload: unknown,
  ) => {
    try {
      await admin.from("webhook_logs").insert({
        source: "paystack",
        event_type: eventType,
        status,
        message,
        signature_valid: signatureValid,
        payload,
      });
    } catch (_) { /* never throw from logger */ }
  };

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  // Load the secret key from admin-managed site_settings
  const { data: settingsRow } = await admin
    .from("site_settings").select("data").eq("id", 1).maybeSingle();
  const secret = (settingsRow?.data as any)?.paystack_secret_key
    ?? Deno.env.get("PAYSTACK_SECRET_KEY")
    ?? "";

  if (!secret) {
    await log("error", "Paystack secret key not configured in site settings", false, null, null);
    return json({ error: "Webhook not configured" }, 500);
  }

  // Verify signature
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  if (!signature || expected !== signature) {
    await log("invalid_signature", "HMAC mismatch", false, null, { signaturePresent: !!signature });
    return json({ error: "Invalid signature" }, 401);
  }

  // Parse payload
  let body: any;
  try { body = JSON.parse(raw); }
  catch {
    await log("invalid_payload", "JSON parse failed", true, null, { raw: raw.slice(0, 500) });
    return json({ error: "Invalid JSON" }, 400);
  }

  const eventType: string = body?.event ?? "";
  const data = body?.data ?? {};

  if (eventType !== "charge.success") {
    await log("ok", `Ignored ${eventType}`, true, eventType, body);
    return json({ received: true, ignored: true });
  }

  const reference: string | undefined = data?.reference;
  const customerEmail: string | undefined = data?.customer?.email?.toLowerCase();
  const metaCode: string | undefined =
    data?.metadata?.registration_code ?? data?.metadata?.custom_fields?.find?.((f: any) => f?.variable_name === "registration_code")?.value;

  // Locate registration: prefer explicit code, fall back to email
  let query = admin.from("event_registrations").select("id, email, registration_code");
  if (metaCode) query = query.eq("registration_code", metaCode);
  else if (customerEmail) query = query.ilike("email", customerEmail);
  else {
    await log("not_found", "No registration_code or customer email in payload", true, eventType, body);
    return json({ received: true, matched: false });
  }
  const { data: matches, error: findErr } = await query.limit(1);
  if (findErr) {
    await log("error", findErr.message, true, eventType, body);
    return json({ error: "Lookup failed" }, 500);
  }
  if (!matches?.length) {
    await log("not_found", `No registration found (code=${metaCode ?? "n/a"}, email=${customerEmail ?? "n/a"})`, true, eventType, body);
    return json({ received: true, matched: false });
  }

  const { error: updErr } = await admin
    .from("event_registrations")
    .update({ payment_status: "paid", payment_reference: reference ?? null, status: "confirmed" })
    .eq("id", matches[0].id);

  if (updErr) {
    await log("error", updErr.message, true, eventType, body);
    return json({ error: "Update failed" }, 500);
  }

  await log("ok", `Marked ${matches[0].registration_code} as paid`, true, eventType, body);
  return json({ received: true, matched: true, registration_code: matches[0].registration_code });
});
