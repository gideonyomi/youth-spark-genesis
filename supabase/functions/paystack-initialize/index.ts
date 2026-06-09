// Initialize a Paystack transaction for an event registration.
// Stores form data in pending_registrations and returns Paystack's authorization_url.
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

  const {
    event, full_name, email, phone, age_range, state, zone_fellowship, notes, photo_url, callback_url,
    country, city, gender, date_of_birth, marital_status, occupation,
  } = body ?? {};

  if (!event || !full_name || !email || !age_range || !state || !zone_fellowship || !photo_url) {
    return json({ error: "Missing required fields" }, 400);
  }

  const ev = String(event).toUpperCase();

  const { data: settingsRow } = await admin.from("site_settings").select("data").eq("id", 1).maybeSingle();
  const s = (settingsRow?.data as any) ?? {};

  const secret = s.paystack_secret_key || Deno.env.get("PAYSTACK_SECRET_KEY") || "";
  if (!secret) return json({ error: "Payment provider not configured. Contact the administrator." }, 500);

  const amountKey = `paystack_amount_${ev.toLowerCase()}`;
  const fallbackKey = "paystack_amount";
  const amountNgn = Number(s[amountKey] ?? s[fallbackKey] ?? 0);
  if (!amountNgn || amountNgn <= 0) {
    return json({ error: `Registration fee for ${ev} is not configured.` }, 500);
  }
  const amountKobo = Math.round(amountNgn * 100);

  const reference = `${ev}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const data = {
    full_name: String(full_name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: phone ? String(phone).trim() : null,
    event: ev,
    age_range: String(age_range),
    state: String(state),
    zone_fellowship: String(zone_fellowship).trim(),
    notes: notes ? String(notes).trim() : null,
    photo_url: String(photo_url),
    country: country ? String(country).trim() : null,
    city: city ? String(city).trim() : null,
    gender: gender ? String(gender).trim() : null,
    date_of_birth: date_of_birth ? String(date_of_birth) : null,
    marital_status: marital_status ? String(marital_status).trim() : null,
    occupation: occupation ? String(occupation).trim() : null,
  };

  const { error: insErr } = await admin.from("pending_registrations").insert({
    reference, event: ev, email: data.email, amount_kobo: amountKobo, data, status: "pending",
  });
  if (insErr) return json({ error: insErr.message }, 500);

  const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data.email, amount: amountKobo, reference, callback_url,
      metadata: { event: ev, full_name: data.full_name, registration_pending: true },
    }),
  });
  const initJson: any = await initRes.json();
  if (!initRes.ok || !initJson?.status) {
    await admin.from("pending_registrations").update({ status: "init_failed" }).eq("reference", reference);
    return json({ error: initJson?.message || "Could not start payment" }, 502);
  }

  await admin.from("webhook_logs").insert({
    source: "paystack", event_type: "initialize", status: "ok",
    message: `Initialized ${reference} for ${data.email}`, signature_valid: true,
    payload: { reference, amountKobo, event: ev },
  });

  return json({
    authorization_url: initJson.data.authorization_url,
    access_code: initJson.data.access_code,
    reference,
  });
});
