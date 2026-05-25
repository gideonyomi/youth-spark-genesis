import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload, X, CheckCircle2 } from "lucide-react";
import logo from "@/assets/blhm-logo.png";

const EVENT_META: Record<string, { tag: string; title: string; blurb: string }> = {
  yec: { tag: "YEC", title: "Youth Empowerment Conference", blurb: "Holiness. Empowerment. Purpose." },
  ssc: { tag: "SSC", title: "Student Success Camp", blurb: "Faith and excellence for the next generation." },
  nss: { tag: "NSS", title: "National Singles' Summit", blurb: "Purposeful living for singles, in holiness." },
};

const AGE_RANGES = ["12–16", "16–20", "21–25", "25–30", "30+"];

const Register = () => {
  const { event } = useParams<{ event: string }>();
  const meta = event ? EVENT_META[event.toLowerCase()] : null;

  const [settings, setSettings] = useState<any>({});
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", age_range: "", notes: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
      setSettings((data as any)?.data ?? {});
    })();
  }, []);

  const paymentUrl = useMemo(() => settings?.[`payment_${event?.toLowerCase()}_url`] || settings?.payment_url || "", [settings, event]);
  const paymentLabel = settings?.payment_button_label || "Proceed to Payment";
  const paymentInstructions = settings?.payment_instructions || "";
  const feeLabel = settings?.[`registration_fee_${event?.toLowerCase()}`] || settings?.registration_fee || "";

  if (!meta) return <Navigate to="/" replace />;

  const onPhoto = (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Photo must be 3MB or less");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) return toast.error("Profile picture is required");
    if (!form.age_range) return toast.error("Please select an age range");

    setBusy(true);
    try {
      const ext = photoFile.name.split(".").pop();
      const path = `${meta.tag}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const up = await supabase.storage.from("registration-photos").upload(path, photoFile, { upsert: false });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("registration-photos").getPublicUrl(path);

      const { data, error } = await supabase.from("event_registrations").insert({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        event: meta.tag,
        age_range: form.age_range,
        notes: form.notes || null,
        photo_url: pub.publicUrl,
      }).select("registration_code").single();
      if (error) throw error;

      setDone({ code: data.registration_code });
      toast.success("Registration successful");
    } catch (err: any) {
      toast.error(err.message || "Could not submit. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="bg-card rounded-2xl shadow-medium border border-border overflow-hidden">
          <div className="bg-primary text-primary-foreground p-7 md:p-9 flex items-center gap-4">
            <img src={logo} alt="" className="w-12 h-12 object-contain bg-card/10 rounded-lg p-1" />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] opacity-80">Register · {meta.tag}</p>
              <h1 className="font-serif text-2xl md:text-3xl font-bold mt-1 leading-tight">{meta.title}</h1>
              <p className="text-sm opacity-90 mt-1">{meta.blurb}</p>
            </div>
          </div>

          {done ? (
            <div className="p-8 md:p-10 text-center">
              <CheckCircle2 className="w-14 h-14 mx-auto text-secondary mb-3" />
              <h2 className="font-serif text-2xl font-bold mb-2">You're registered!</h2>
              <p className="text-muted-foreground mb-6">Please save your registration ID — you will need it on the event day.</p>
              <div className="inline-block bg-muted rounded-xl px-8 py-5 mb-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Your Registration ID</p>
                <p className="font-serif text-4xl font-bold tracking-wider mt-1">{done.code}</p>
              </div>

              {paymentUrl && (
                <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-5 text-left mb-5">
                  <p className="font-semibold mb-1">Complete your payment</p>
                  {feeLabel && <p className="text-sm text-muted-foreground mb-2">Fee: {feeLabel}</p>}
                  {paymentInstructions && <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{paymentInstructions}</p>}
                  <a href={paymentUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-secondary text-secondary-foreground font-semibold px-6 py-3 rounded-full text-sm hover:shadow-medium transition-all active:scale-[0.97]">
                    {paymentLabel}
                  </a>
                </div>
              )}

              <Link to="/" className="inline-block text-sm underline text-muted-foreground">Return to home</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="p-7 md:p-9 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Profile picture <span className="text-destructive">*</span></label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img src={photoPreview} alt="" className="w-20 h-20 rounded-full object-cover border border-border" />
                      <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted grid place-items-center text-muted-foreground text-xs">No photo</div>
                  )}
                  <label className="inline-flex items-center gap-2 text-sm border border-dashed border-border px-4 py-2.5 rounded-lg cursor-pointer hover:bg-muted">
                    <Upload className="w-4 h-4" />
                    {photoFile ? "Replace" : "Upload photo"}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Required. JPG or PNG. Max 3MB.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Full name <span className="text-destructive">*</span></label>
                  <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Email <span className="text-destructive">*</span></label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Age range <span className="text-destructive">*</span></label>
                  <select required value={form.age_range} onChange={(e) => setForm({ ...form, age_range: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="">Select age range</option>
                    {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Notes (optional)</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  placeholder="Anything we should know?" />
              </div>

              {(paymentUrl || paymentInstructions) && (
                <div className="bg-muted/60 border border-border rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Payment</p>
                  {feeLabel && <p className="mb-1">Fee: <span className="text-foreground font-medium">{feeLabel}</span></p>}
                  <p>You'll receive a payment link and your registration ID right after submitting.</p>
                </div>
              )}

              <button type="submit" disabled={busy}
                className="w-full bg-secondary text-secondary-foreground font-semibold py-4 rounded-full text-base transition-all active:scale-[0.97] hover:shadow-medium disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {busy ? "Submitting…" : `Register for ${meta.tag}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
