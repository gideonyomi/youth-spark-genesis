// Paystack webhook receiver — verifies HMAC and finalizes registrations
// from `pending_registrations` on `charge.success`. Idempotent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const log = async (status: string, message: string, signatureValid: boolean, eventType: string | null, payload: unknown) => {
    try {
      await admin.from("webhook_logs").insert({
        source: "paystack", event_type: eventType, status, message,
        signature_valid: signatureValid, payload,
      });
    } catch (_) {}
  };

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  const { data: settingsRow } = await admin.from("site_settings").select("data").eq("id", 1).maybeSingle();
  const secret = (settingsRow?.data as any)?.paystack_secret_key ?? Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
  if (!secret) {
    await log("error", "Paystack secret key not configured", false, null, null);
    return json({ error: "Webhook not configured" }, 500);
  }

  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  if (!signature || expected !== signature) {
    await log("invalid_signature", "HMAC mismatch", false, null, { signaturePresent: !!signature });
    return json({ error: "Invalid signature" }, 401);
  }

  let body: any;
  try { body = JSON.parse(raw); } catch {
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
  if (!reference) {
    await log("error", "No reference in payload", true, eventType, body);
    return json({ received: true, matched: false });
  }

  // Idempotency
  const { data: already } = await admin.from("event_registrations")
    .select("id, registration_code").eq("payment_reference", reference).maybeSingle();
  if (already) {
    await log("ok", `Already finalized ${already.registration_code}`, true, eventType, { reference });
    return json({ received: true, already: true });
  }

  const { data: pending } = await admin.from("pending_registrations")
    .select("*").eq("reference", reference).maybeSingle();
  if (!pending) {
    await log("not_found", `No pending row for ${reference}`, true, eventType, body);
    return json({ received: true, matched: false });
  }

  const d = pending.data as any;
  const amountKobo = Number(data?.amount ?? pending.amount_kobo);
  const paidAt = data?.paid_at || new Date().toISOString();

  const { data: created, error: createErr } = await admin.from("event_registrations").insert({
    full_name: d.full_name, email: d.email, phone: d.phone, event: d.event,
    age_range: d.age_range, state: d.state, zone_fellowship: d.zone_fellowship,
    notes: d.notes, photo_url: d.photo_url,
    payment_status: "paid", payment_reference: reference,
    payment_amount: amountKobo, paid_at: paidAt, status: "confirmed",
  }).select("id, registration_code").single();

  if (createErr) {
    await log("error", createErr.message, true, eventType, body);
    return json({ error: "Could not finalize" }, 500);
  }

  await admin.from("pending_registrations")
    .update({ status: "finalized", finalized_registration_id: created.id })
    .eq("reference", reference);

  await log("ok", `Finalized ${created.registration_code} via webhook`, true, eventType, { reference });
  return json({ received: true, finalized: created.registration_code });
});
