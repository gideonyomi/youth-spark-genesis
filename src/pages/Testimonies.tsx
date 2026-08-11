import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const initialsOf = (name: string) =>
  name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "—";

const Testimonies = () => {
  const [published, setPublished] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", location: "", story: "" });

  useEffect(() => {
    document.title = "Testimonies — Share Your Story | BLHMYOUTH";
    (async () => {
      const { data } = await supabase
        .from("testimony_submissions")
        .select("id,name,location,story,created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      setPublished(data ?? []);
      setLoading(false);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Please enter your name");
    if (form.story.trim().length < 20) return toast.error("Please share a little more of your story");
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return toast.error("Please enter a valid email address");

    setBusy(true);
    const { error } = await supabase.from("testimony_submissions").insert({
      name: form.name.trim(),
      email: form.email.trim() || null,
      location: form.location.trim() || null,
      story: form.story.trim(),
    });
    setBusy(false);
    if (error) return toast.error("Could not submit. Please try again.");
    setSubmitted(true);
    setForm({ name: "", email: "", location: "", story: "" });
  };

  const inputCls = "w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="min-h-screen">
      <Navbar />

      <header className="pt-32 pb-16 md:pt-40 md:pb-20 px-4 bg-muted/40">
        <div className="container max-w-3xl mx-auto text-center">
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">Stories From Our Community</p>
          <h1 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance">Share Your Testimony</h1>
          <p className="text-muted-foreground text-lg mt-4">
            Has God done something in your life through this community? Tell us — we'd love to celebrate with you.
            Every testimony is reviewed by our team before it is published.
          </p>
        </div>
      </header>

      <section className="py-16 md:py-24 px-4">
        <div className="container max-w-2xl mx-auto">
          <div className="bg-card rounded-xl p-8 md:p-10 shadow-medium">
            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-secondary mx-auto mb-4" />
                <h2 className="font-serif font-bold text-2xl mb-2">Thank you for sharing!</h2>
                <p className="text-muted-foreground">
                  Your testimony has been received. Our team will review it, and it may be published on this page.
                </p>
                <button onClick={() => setSubmitted(false)}
                  className="mt-6 text-sm font-semibold underline underline-offset-4">Share another testimony</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-card-foreground mb-1.5">Name *</label>
                    <input required maxLength={120} value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputCls} placeholder="Your name (or 'Anonymous')" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-card-foreground mb-1.5">Email (optional)</label>
                    <input type="email" maxLength={255} value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputCls} placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-1.5">Location / Chapter</label>
                  <input maxLength={120} value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className={inputCls} placeholder="e.g. Lagos, Campus fellowship" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-1.5">Your Testimony *</label>
                  <textarea required rows={6} maxLength={1500} value={form.story}
                    onChange={(e) => setForm({ ...form, story: e.target.value })}
                    className={`${inputCls} resize-none`} placeholder="Tell us what happened…" />
                  <p className="text-xs text-muted-foreground mt-1">{form.story.length}/1500</p>
                </div>
                <button type="submit" disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-semibold py-4 rounded-full text-base transition-all duration-200 active:scale-[0.97] hover:shadow-medium disabled:opacity-60">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Testimony
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="pb-24 md:pb-32 px-4">
        <div className="container max-w-6xl mx-auto">
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-center mb-10">Real People, Real Stories</h2>
          {loading ? (
            <div className="flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : published.length === 0 ? (
            <p className="text-center text-muted-foreground">No testimonies have been published yet — yours could be the first.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {published.map((t) => (
                <article key={t.id} className="bg-card rounded-xl p-7 shadow-soft">
                  <p className="text-muted-foreground leading-relaxed mb-6 italic font-serif text-lg">"{t.story}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {initialsOf(t.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-card-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.location ?? "BLHMYOUTH family"}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Testimonies;
