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

// Intelligent placement: route registrant to the most appropriate event based on
// their academic level, occupation, and age. NSS registrations are left alone.
function routeEvent(submitted: string, d: {
  class_level?: string | null;
  occupation?: string | null;
  age_range?: string | null;
}): string {
  if (submitted === "NSS") return "NSS";

  const yecOccupations = new Set([
    "Undergraduate (300 Level and Above)",
    "Employed",
    "Self-Employed",
    "Unemployed",
  ]);
  if (d.occupation && yecOccupations.has(d.occupation)) return "YEC";

  const sscClasses = new Set([
    "JSS 1", "JSS 2", "JSS 3",
    "SS 1", "SS 2", "SS 3",
    "Seeking Admission", "100 Level", "200 Level",
  ]);
  if (d.class_level && sscClasses.has(d.class_level)) return "SSC";

  if (d.age_range && (d.age_range === "12–16" || d.age_range === "16–20")) return "SSC";

  return submitted;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const {
    event, full_name, email, phone, age_range, state, zone_fellowship, notes, photo_url, callback_url,
    country, city, gender, marital_status, occupation,
    class_level, first_time_attendee,
  } = body ?? {};

  const submittedEvent = String(event ?? "").toUpperCase();

  // Email is compulsory for every event category, including SSC.
  const emailRaw = email ? String(email).trim().toLowerCase() : "";
  const missing: string[] = [];
  if (!submittedEvent) missing.push("event");
  if (!full_name) missing.push("full name");
  if (!state) missing.push("state");
  if (!zone_fellowship) missing.push("zone / fellowship");
  if (!photo_url) missing.push("photo");
  if (!emailRaw) missing.push("email");
  if (missing.length) {
    return json({ error: `Missing required field(s): ${missing.join(", ")}` }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return json({ error: "Please enter a valid email address" }, 400);
  }


  const ev = routeEvent(submittedEvent, { class_level, occupation, age_range });

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

  // Build a stable email for Paystack (it requires a syntactically valid address).
  // When SSC participants don't provide an email, generate a deterministic placeholder
  // on a real TLD — Paystack rejects invented TLDs like ".placeholder".
  const emailRaw = email ? String(email).trim().toLowerCase() : "";
  const emailForPaystack = emailRaw || `no-reply.${reference.toLowerCase()}@blhmyouth.org`;


  const data = {
    full_name: String(full_name).trim(),
    email: emailRaw || null,
    phone: phone ? String(phone).trim() : null,
    event: ev,
    original_event: submittedEvent,
    age_range: age_range ? String(age_range) : null,
    state: String(state),
    zone_fellowship: String(zone_fellowship).trim(),
    notes: notes ? String(notes).trim() : null,
    photo_url: String(photo_url),
    country: country ? String(country).trim() : null,
    city: city ? String(city).trim() : null,
    gender: gender ? String(gender).trim() : null,
    marital_status: marital_status ? String(marital_status).trim() : null,
    occupation: occupation ? String(occupation).trim() : null,
    class_level: class_level ? String(class_level).trim() : null,
    first_time_attendee: typeof first_time_attendee === "boolean" ? first_time_attendee : null,
  };

  const { error: insErr } = await admin.from("pending_registrations").insert({
    reference, event: ev, original_event: submittedEvent,
    email: emailForPaystack, amount_kobo: amountKobo, data, status: "pending",
  });
  if (insErr) return json({ error: insErr.message }, 500);

  const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailForPaystack, amount: amountKobo, reference, callback_url,
      metadata: { event: ev, original_event: submittedEvent, full_name: data.full_name, registration_pending: true },
    }),
  });
  const initJson: any = await initRes.json();
  if (!initRes.ok || !initJson?.status) {
    await admin.from("pending_registrations").update({ status: "init_failed" }).eq("reference", reference);
    return json({ error: initJson?.message || "Could not start payment" }, 502);
  }

  await admin.from("webhook_logs").insert({
    source: "paystack", event_type: "initialize", status: "ok",
    message: `Initialized ${reference} for ${emailForPaystack} (submitted ${submittedEvent} → routed ${ev})`,
    signature_valid: true,
    payload: { reference, amountKobo, event: ev, submitted: submittedEvent },
  });

  return json({
    authorization_url: initJson.data.authorization_url,
    access_code: initJson.data.access_code,
    reference,
    routed_event: ev,
    submitted_event: submittedEvent,
  });
  } catch (err) {
    console.error("paystack-initialize unexpected error:", err);
    return json({ error: "Unexpected server error while starting payment." }, 500);
  }
});

