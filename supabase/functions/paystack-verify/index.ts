// Verify a Paystack transaction and finalize the registration.
// Idempotent: if a registration already exists for this reference, returns it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const reference = (body?.reference || "").toString();
  if (!reference) return json({ error: "reference required" }, 400);

  const log = (status: string, message: string, payload: unknown) =>
    admin.from("webhook_logs").insert({
      source: "paystack", event_type: "verify", status, message,
      signature_valid: true, payload,
    }).then(() => {}, () => {});

  // Already finalized?
  const { data: existing } = await admin.from("event_registrations")
    .select("id, registration_code, full_name, photo_url, event, payment_status")
    .eq("payment_reference", reference).maybeSingle();
  if (existing && existing.payment_status === "paid") {
    return json({
      status: "paid",
      registration: {
        code: existing.registration_code,
        full_name: existing.full_name,
        photo_url: existing.photo_url,
        event: existing.event,
      },
    });
  }

  const { data: settingsRow } = await admin.from("site_settings").select("data").eq("id", 1).maybeSingle();
  const secret = (settingsRow?.data as any)?.paystack_secret_key || Deno.env.get("PAYSTACK_SECRET_KEY") || "";
  if (!secret) return json({ error: "Payment provider not configured" }, 500);

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const v: any = await verifyRes.json();
  if (!verifyRes.ok || !v?.status) {
    await log("error", v?.message || "Verify failed", { reference });
    return json({ status: "error", error: v?.message || "Could not verify payment" }, 502);
  }

  const txStatus = v.data?.status;
  if (txStatus !== "success") {
    await log("not_paid", `Status ${txStatus}`, v.data);
    await admin.from("pending_registrations").update({ status: txStatus || "failed" }).eq("reference", reference);
    return json({ status: txStatus || "failed" });
  }

  // Look up pending row
  const { data: pending } = await admin.from("pending_registrations")
    .select("*").eq("reference", reference).maybeSingle();
  if (!pending) {
    await log("error", "No pending registration", { reference });
    return json({ status: "error", error: "Registration data missing" }, 404);
  }

  const d = pending.data as any;
  const paidAt = v.data?.paid_at || v.data?.paidAt || new Date().toISOString();
  const amountKobo = Number(v.data?.amount ?? pending.amount_kobo);

  // Create registration (registration_code is assigned by trigger)
  const { data: created, error: createErr } = await admin.from("event_registrations").insert({
    full_name: d.full_name,
    email: d.email,
    phone: d.phone,
    event: d.event,
    age_range: d.age_range,
    state: d.state,
    zone_fellowship: d.zone_fellowship,
    notes: d.notes,
    photo_url: d.photo_url,
    payment_status: "paid",
    payment_reference: reference,
    payment_amount: amountKobo,
    paid_at: paidAt,
    status: "confirmed",
  }).select("id, registration_code, full_name, photo_url, event").single();

  if (createErr) {
    // If unique violation on payment_reference, fetch the existing row
    const { data: again } = await admin.from("event_registrations")
      .select("id, registration_code, full_name, photo_url, event")
      .eq("payment_reference", reference).maybeSingle();
    if (again) {
      await admin.from("pending_registrations").update({ status: "finalized", finalized_registration_id: again.id }).eq("reference", reference);
      return json({ status: "paid", registration: { code: again.registration_code, full_name: again.full_name, photo_url: again.photo_url, event: again.event } });
    }
    await log("error", createErr.message, { reference });
    return json({ status: "error", error: createErr.message }, 500);
  }

  await admin.from("pending_registrations")
    .update({ status: "finalized", finalized_registration_id: created.id })
    .eq("reference", reference);

  await log("ok", `Finalized ${created.registration_code}`, { reference, amountKobo });

  return json({
    status: "paid",
    registration: {
      code: created.registration_code,
      full_name: created.full_name,
      photo_url: created.photo_url,
      event: created.event,
    },
  });
});
