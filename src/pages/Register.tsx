import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import logo from "@/assets/blhm-logo.png";
import { NIGERIAN_STATES } from "@/lib/nigerian-states";
import { COUNTRIES } from "@/lib/countries";
import NameTagDownload from "@/components/NameTagDownload";

const EVENT_META: Record<string, { tag: string; title: string; blurb: string }> = {
  yec: { tag: "YEC", title: "Youth Empowerment Conference", blurb: "Holiness. Empowerment. Purpose." },
  ssc: { tag: "SSC", title: "Student Success Camp", blurb: "Faith and excellence for the next generation." },
  nss: { tag: "NSS", title: "National Singles' Summit", blurb: "Purposeful living for singles, in holiness." },
};

const AGE_RANGES = ["12–16", "16–20", "21–25", "25–30", "30+"];
const GENDERS = ["Male", "Female"];
const MARITAL = ["Single", "Engaged", "Married"];
const OCCUPATIONS = ["Employed", "Student", "Self-Employed"];

const Register = () => {
  const { event } = useParams<{ event: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const meta = event ? EVENT_META[event.toLowerCase()] : null;

  const [settings, setSettings] = useState<any>({});
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    country: "Nigeria", state: "", city: "",
    age_range: "", gender: "",
    marital_status: "", occupation: "",
    zone_fellowship: "", notes: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [done, setDone] = useState<{ code: string; full_name: string; photo_url: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
      setSettings((data as any)?.data ?? {});
    })();
  }, []);

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (!reference || done || verifying) return;
    (async () => {
      setVerifying(true);
      setFailed(null);
      try {
        const { data, error } = await supabase.functions.invoke("paystack-verify", { body: { reference } });
        if (error) throw error;
        if (data?.status === "paid" && data.registration) {
          setDone({
            code: data.registration.code,
            full_name: data.registration.full_name,
            photo_url: data.registration.photo_url,
          });
          toast.success("Payment confirmed — you're registered!");
        } else {
          setFailed("Your payment was not completed. Please try again to finalize your registration.");
        }
      } catch (err: any) {
        setFailed(err.message || "Could not verify payment.");
      } finally {
        setVerifying(false);
        const sp = new URLSearchParams(searchParams);
        sp.delete("reference"); sp.delete("trxref");
        setSearchParams(sp, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const feeLabel = useMemo(() => {
    const amt = settings?.[`paystack_amount_${event?.toLowerCase()}`] ?? settings?.paystack_amount;
    if (amt) return `₦${Number(amt).toLocaleString()}`;
    return settings?.[`registration_fee_${event?.toLowerCase()}`] || settings?.registration_fee || "";
  }, [settings, event]);

  if (!meta) return <Navigate to="/" replace />;

  const isNigeria = form.country === "Nigeria";

  const onPhoto = (file: File) => {
    if (file.size > 3 * 1024 * 1024) return toast.error("Photo must be 3MB or less");
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) return toast.error("Profile picture is required");
    if (!form.country) return toast.error("Please select your country");
    if (!form.state.trim()) return toast.error("Please enter your state/province/region");
    if (!form.city.trim()) return toast.error("Please enter your city");
    if (!form.gender) return toast.error("Please select gender");
    if (!form.marital_status) return toast.error("Please select marital status");
    if (!form.occupation) return toast.error("Please select occupation");
    if (!form.age_range) return toast.error("Please select an age range");
    if (!form.zone_fellowship.trim()) return toast.error("Please enter your zone / fellowship");

    setBusy(true);
    try {
      const ext = photoFile.name.split(".").pop();
      const path = `${meta.tag}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const up = await supabase.storage.from("registration-photos").upload(path, photoFile, { upsert: false });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("registration-photos").getPublicUrl(path);

      const callback_url = `${window.location.origin}/register/${event}`;

      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: {
          event: meta.tag,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || null,
          country: form.country,
          state: form.state.trim(),
          city: form.city.trim(),
          gender: form.gender,
          marital_status: form.marital_status,
          occupation: form.occupation,
          age_range: form.age_range,
          zone_fellowship: form.zone_fellowship.trim(),
          notes: form.notes || null,
          photo_url: pub.publicUrl,
          callback_url,
        },
      });
      if (error) throw error;
      if (!data?.authorization_url) throw new Error("Could not start payment");

      window.location.href = data.authorization_url;
    } catch (err: any) {
      toast.error(err.message || "Could not start payment. Try again.");
      setBusy(false);
    }
  };

  const inputCls = "w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent";

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

          {verifying ? (
            <div className="p-10 text-center">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-muted-foreground mb-3" />
              <h2 className="font-serif text-xl font-bold mb-1">Verifying your payment…</h2>
              <p className="text-sm text-muted-foreground">Please don't close this page.</p>
            </div>
          ) : done ? (
            <div className="p-8 md:p-10 text-center">
              <CheckCircle2 className="w-14 h-14 mx-auto text-secondary mb-3" />
              <h2 className="font-serif text-2xl font-bold mb-2">You're registered!</h2>
              <p className="text-muted-foreground mb-6">Payment confirmed. Save your registration ID — you'll need it on the event day.</p>
              <div className="inline-block bg-muted rounded-xl px-8 py-5 mb-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Your Registration ID</p>
                <p className="font-serif text-4xl font-bold tracking-wider mt-1">{done.code}</p>
              </div>

              <div className="mb-6">
                <NameTagDownload attendee={{
                  full_name: done.full_name,
                  registration_code: done.code,
                  event: meta.tag,
                  photo_url: done.photo_url,
                }} />
                <p className="text-xs text-muted-foreground mt-3">
                  Save or print your name tag. Your official conference badge will be issued at check-in.
                </p>
              </div>

              <Link to="/" className="inline-block text-sm underline text-muted-foreground">Return to home</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="p-7 md:p-9 space-y-5">
              {failed && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Payment not completed</p>
                    <p className="opacity-90">{failed}</p>
                  </div>
                </div>
              )}

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
                  <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Email <span className="text-destructive">*</span></label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Phone <span className="text-destructive">*</span></label>
                  <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Include country code if outside Nigeria" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Age range <span className="text-destructive">*</span></label>
                  <select required value={form.age_range} onChange={(e) => setForm({ ...form, age_range: e.target.value })} className={inputCls}>
                    <option value="">Select age range</option>
                    {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Gender <span className="text-destructive">*</span></label>
                  <select required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputCls}>
                    <option value="">Select gender</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Marital status <span className="text-destructive">*</span></label>
                  <select required value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })} className={inputCls}>
                    <option value="">Select marital status</option>
                    {MARITAL.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Occupation <span className="text-destructive">*</span></label>
                  <select required value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputCls}>
                    <option value="">Select occupation</option>
                    {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Country <span className="text-destructive">*</span></label>
                  <select required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value, state: "" })} className={inputCls}>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{isNigeria ? "State" : "State / Province / Region"} <span className="text-destructive">*</span></label>
                  {isNigeria ? (
                    <select required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls}>
                      <option value="">Select your state</option>
                      {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input required value={form.state} maxLength={100}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="e.g. Greater London" className={inputCls} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">City <span className="text-destructive">*</span></label>
                  <input required value={form.city} maxLength={100}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City of residence" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Zone / Fellowship <span className="text-destructive">*</span></label>
                <input required value={form.zone_fellowship} maxLength={120}
                  onChange={(e) => setForm({ ...form, zone_fellowship: e.target.value })}
                  placeholder="e.g. Ikeja Zone / Campus Fellowship" className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Notes (optional)</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={`${inputCls} resize-none`} placeholder="Anything we should know?" />
              </div>

              <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 text-sm">
                <p className="font-semibold text-foreground mb-1">Payment required to complete registration</p>
                {feeLabel && <p className="mb-1">Fee: <span className="font-semibold">{feeLabel}</span></p>}
                <p className="text-muted-foreground">You'll be securely redirected to Paystack. Your registration ID and name tag are issued after payment is confirmed.</p>
              </div>

              <button type="submit" disabled={busy}
                className="w-full bg-secondary text-secondary-foreground font-semibold py-4 rounded-full text-base transition-all active:scale-[0.97] hover:shadow-medium disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {busy ? "Redirecting to payment…" : `Pay & Register for ${meta.tag}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
