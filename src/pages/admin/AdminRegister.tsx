import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, CheckCircle2 } from "lucide-react";
import { NIGERIAN_STATES } from "@/lib/nigerian-states";
import { COUNTRIES } from "@/lib/countries";
import { processPassportPhoto } from "@/lib/photo-processor";
import {
  EVENT_META, GENDERS, MARITAL, SSC_CLASSES,
  emptyRegistrationForm, rulesFor, validateRegistration,
} from "@/lib/registration-fields";

const EVENTS = ["YEC", "SSC", "NSS"] as const;

const AdminRegister = () => {
  const [tag, setTag] = useState<string>("YEC");
  const [form, setForm] = useState({ ...emptyRegistrationForm });
  const [paymentReference, setPaymentReference] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [done, setDone] = useState<{ registration_code: string; full_name: string; event: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
      setSettings((data as any)?.data ?? {});
    })();
  }, []);

  const r = rulesFor(tag);
  const isNigeria = form.country === "Nigeria";

  const amountKobo = useMemo(() => {
    const naira = settings?.[`paystack_amount_${tag.toLowerCase()}`] ?? settings?.paystack_amount;
    return naira ? Math.round(Number(naira) * 100) : null;
  }, [settings, tag]);

  const onPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    setProcessingPhoto(true);
    try {
      const result = await processPassportPhoto(file);
      setPhotoFile(result.file);
      setPhotoPreview(result.dataUrl);
    } catch (err: any) {
      toast.error(err.message || "Could not process that photo");
    } finally {
      setProcessingPhoto(false);
    }
  };

  const reset = () => {
    setForm({ ...emptyRegistrationForm });
    setPaymentReference("");
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateRegistration(tag, form);
    if (err) return toast.error(err);
    if (!photoFile) return toast.error("Passport photo is required");
    if (!paymentReference.trim()) return toast.error("Payment reference is required");

    setBusy(true);
    try {
      const ext = photoFile.name.split(".").pop();
      const path = `${tag}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const up = await supabase.storage.from("registration-photos").upload(path, photoFile, { upsert: false });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("registration-photos").getPublicUrl(path);

      const { data, error } = await supabase.rpc("admin_create_registration", {
        p_event: tag,
        p_full_name: form.full_name.trim(),
        p_email: form.email.trim() || null,
        p_phone: form.phone.trim() || null,
        p_country: form.country,
        p_state: form.state.trim(),
        p_city: form.city.trim(),
        p_gender: form.gender,
        p_marital_status: r.askMarital ? form.marital_status : null,
        p_occupation: form.occupation,
        p_age_range: form.age_range,
        p_class_level: r.askClass ? form.class_level : null,
        p_first_time_attendee: r.askFirstTime ? form.first_time_attendee === "Yes" : null,
        p_zone_fellowship: form.zone_fellowship.trim(),
        p_notes: form.notes.trim() || null,
        p_photo_url: pub.publicUrl,
        p_payment_reference: paymentReference.trim(),
        p_payment_amount: amountKobo,
      });
      if (error) throw error;
      const res = data as any;
      setDone({ registration_code: res.registration_code, full_name: res.full_name, event: res.event });
      reset();
      toast.success(`Registered — ${res.registration_code}`);
    } catch (err: any) {
      toast.error(err.message || "Could not complete the registration");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full border border-border rounded-lg px-3 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <div>
      <h1 className="font-serif text-2xl md:text-3xl font-bold">Admin Registration</h1>
      <p className="text-muted-foreground text-sm mt-1 mb-6">
        Register an attendee manually. No payment is processed here — enter the payment reference for record-keeping.
      </p>

      {done && (
        <div className="mb-6 rounded-lg border border-secondary/40 bg-secondary/10 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">{done.full_name} registered for {done.event}</p>
            <p className="text-muted-foreground">Registration ID: <span className="font-mono font-semibold text-foreground">{done.registration_code}</span></p>
          </div>
          <button onClick={() => setDone(null)} className="ml-auto p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
      )}

      <form onSubmit={submit} className="bg-card border border-border rounded-xl p-5 md:p-7 space-y-5 max-w-3xl">
        <div>
          <label className={labelCls}>Event</label>
          <div className="flex gap-2 flex-wrap">
            {EVENTS.map((ev) => (
              <button type="button" key={ev} onClick={() => setTag(ev)}
                className={`text-sm px-4 py-2 rounded-full border ${tag === ev ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                {ev} · {EVENT_META[ev.toLowerCase()].title}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Passport photo *</label>
          <div className="flex items-center gap-4">
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="" className="w-20 h-20 rounded-lg object-cover border border-border" />
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <label className="cursor-pointer inline-flex items-center gap-2 border border-dashed border-border rounded-lg px-4 py-3 text-sm hover:bg-muted">
                {processingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {processingPhoto ? "Optimizing…" : "Upload photo"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full name *</label>
            <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email {r.emailRequired ? "*" : "(optional)"}</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Country *</label>
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value, state: "" })} className={inputCls}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{isNigeria ? "State *" : "State / Province *"}</label>
            {isNigeria ? (
              <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls}>
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls} />
            )}
          </div>
          <div>
            <label className={labelCls}>City *</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Gender *</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputCls}>
              <option value="">Select</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Age range *</label>
            <select value={form.age_range} onChange={(e) => setForm({ ...form, age_range: e.target.value })} className={inputCls}>
              <option value="">Select</option>
              {r.ageRanges.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {r.askMarital && (
            <div>
              <label className={labelCls}>Marital status *</label>
              <select value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })} className={inputCls}>
                <option value="">Select</option>
                {MARITAL.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Occupation *</label>
            <select value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputCls}>
              <option value="">Select</option>
              {r.occupationOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {r.askClass && (
            <div>
              <label className={labelCls}>Class *</label>
              <select value={form.class_level} onChange={(e) => setForm({ ...form, class_level: e.target.value })} className={inputCls}>
                <option value="">Select</option>
                {SSC_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          {r.askFirstTime && (
            <div>
              <label className={labelCls}>First-time attendee? *</label>
              <select value={form.first_time_attendee} onChange={(e) => setForm({ ...form, first_time_attendee: e.target.value })} className={inputCls}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Zone / Fellowship *</label>
            <input value={form.zone_fellowship} onChange={(e) => setForm({ ...form, zone_fellowship: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Payment reference *</label>
            <input required value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. BLHM-YEC-000123" className={`${inputCls} font-mono`} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputCls} resize-none`} />
        </div>

        <p className="text-xs text-muted-foreground">
          Fee on record: {amountKobo ? `₦${(amountKobo / 100).toLocaleString()}` : "not set"} — no payment is charged for admin registrations.
        </p>

        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Complete registration
        </button>
      </form>
    </div>
  );
};

export default AdminRegister;
