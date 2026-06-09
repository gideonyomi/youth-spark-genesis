import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, CheckCircle2, ShieldCheck, Star } from "lucide-react";
import logo from "@/assets/blhm-logo.png";

const EVENT_META: Record<string, { tag: string; title: string }> = {
  yec: { tag: "YEC", title: "Youth Empowerment Conference" },
  ssc: { tag: "SSC", title: "Student Success Camp" },
  nss: { tag: "NSS", title: "National Singles' Summit" },
};

type Field = {
  id: string;
  label: string;
  type: "rating" | "text" | "textarea" | "select" | "radio";
  required?: boolean;
  options?: string[];
  scale?: number; // default 5
};
type Section = { id: string; title: string; description?: string; fields: Field[] };
type Form = { id: string; title: string; description?: string; sections: Section[] };
type Reg = { id: string; full_name: string; event: string; registration_code: string };

const Evaluate = () => {
  const { event } = useParams<{ event: string }>();
  const meta = event ? EVENT_META[event.toLowerCase()] : null;

  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [reg, setReg] = useState<Reg | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!meta) return <Navigate to="/" replace />;

  const validate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Enter your Registration ID");
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc("validate_registration_code", {
        _event: meta.tag, _code: code.trim(),
      });
      if (error) throw error;
      const r = data as any;
      if (!r?.valid) {
        const reason = r?.reason;
        if (reason === "no_active_form") toast.error("Evaluation is not yet open for this event.");
        else if (reason === "unpaid") toast.error("This Registration ID has no confirmed payment.");
        else toast.error("Registration ID not found for this event.");
        return;
      }
      setReg(r.registration);
      setForm(r.form);
    } catch (err: any) {
      toast.error(err.message || "Could not verify Registration ID");
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !reg) return;
    // required check
    for (const sec of form.sections ?? []) {
      for (const f of sec.fields ?? []) {
        if (f.required && (answers[f.id] === undefined || answers[f.id] === "" || answers[f.id] === null)) {
          toast.error(`Please complete: ${f.label}`);
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("submit_evaluation", {
        _event: meta.tag, _code: reg.registration_code, _form_id: form.id, _answers: answers,
      });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Could not submit evaluation");
    } finally {
      setSubmitting(false);
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
              <p className="text-xs uppercase tracking-[0.18em] opacity-80">Evaluation · {meta.tag}</p>
              <h1 className="font-serif text-2xl md:text-3xl font-bold mt-1 leading-tight">{meta.title}</h1>
              <p className="text-sm opacity-90 mt-1">Your feedback helps us serve better.</p>
            </div>
          </div>

          {done ? (
            <div className="p-10 text-center">
              <CheckCircle2 className="w-14 h-14 mx-auto text-secondary mb-3" />
              <h2 className="font-serif text-2xl font-bold mb-2">Thank you!</h2>
              <p className="text-muted-foreground">Your evaluation has been received.</p>
            </div>
          ) : !reg || !form ? (
            <form onSubmit={validate} className="p-7 md:p-9 space-y-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4" /> Only registered attendees can submit an evaluation.
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Your Registration ID <span className="text-destructive">*</span></label>
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={`e.g. ${meta.tag}001`} className={`${inputCls} font-mono tracking-wider`} required />
                <p className="text-xs text-muted-foreground mt-1.5">You received this after completing your paid registration.</p>
              </div>
              <button type="submit" disabled={checking}
                className="w-full bg-secondary text-secondary-foreground font-semibold py-4 rounded-full inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {checking && <Loader2 className="w-4 h-4 animate-spin" />}
                {checking ? "Verifying…" : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={submit} className="p-7 md:p-9 space-y-7">
              <div className="bg-muted/40 border border-border rounded-lg p-4 text-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Submitting as</p>
                <p className="font-semibold">{reg.full_name} <span className="font-mono text-muted-foreground">· {reg.registration_code}</span></p>
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold">{form.title}</h2>
                {form.description && <p className="text-sm text-muted-foreground mt-1">{form.description}</p>}
              </div>

              {(form.sections ?? []).map((sec) => (
                <section key={sec.id} className="space-y-4">
                  <div>
                    <h3 className="font-serif text-lg font-semibold">{sec.title}</h3>
                    {sec.description && <p className="text-sm text-muted-foreground">{sec.description}</p>}
                  </div>
                  {(sec.fields ?? []).map((f) => {
                    const val = answers[f.id];
                    const set = (v: any) => setAnswers({ ...answers, [f.id]: v });
                    return (
                      <div key={f.id}>
                        <label className="block text-sm font-medium mb-1.5">
                          {f.label} {f.required && <span className="text-destructive">*</span>}
                        </label>
                        {f.type === "rating" && (
                          <div className="flex gap-1.5">
                            {Array.from({ length: f.scale ?? 5 }).map((_, i) => {
                              const n = i + 1;
                              const active = Number(val) >= n;
                              return (
                                <button type="button" key={n} onClick={() => set(n)}
                                  className={`p-2 rounded-md border transition-colors ${active ? "bg-secondary/15 border-secondary text-secondary" : "border-border hover:bg-muted"}`}
                                  aria-label={`${n} of ${f.scale ?? 5}`}>
                                  <Star className={`w-5 h-5 ${active ? "fill-current" : ""}`} />
                                </button>
                              );
                            })}
                            {val !== undefined && <span className="self-center text-sm text-muted-foreground ml-2">{val} / {f.scale ?? 5}</span>}
                          </div>
                        )}
                        {f.type === "text" && (
                          <input value={val ?? ""} onChange={(e) => set(e.target.value)} className={inputCls} />
                        )}
                        {f.type === "textarea" && (
                          <textarea rows={4} value={val ?? ""} onChange={(e) => set(e.target.value)} className={`${inputCls} resize-none`} />
                        )}
                        {f.type === "select" && (
                          <select value={val ?? ""} onChange={(e) => set(e.target.value)} className={inputCls}>
                            <option value="">Select…</option>
                            {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        )}
                        {f.type === "radio" && (
                          <div className="space-y-1.5">
                            {(f.options ?? []).map((o) => (
                              <label key={o} className="flex items-center gap-2 text-sm">
                                <input type="radio" name={f.id} value={o} checked={val === o} onChange={() => set(o)} />
                                {o}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              ))}

              <button type="submit" disabled={submitting}
                className="w-full bg-secondary text-secondary-foreground font-semibold py-4 rounded-full inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Submitting…" : "Submit evaluation"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Evaluate;
