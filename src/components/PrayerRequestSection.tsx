import { useEffect, useRef, useState } from "react";
import { HandHeart } from "lucide-react";

const PrayerRequestSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", request: "", anonymous: false });

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: "", email: "", request: "", anonymous: false });
  };

  return (
    <section id="prayer" className="py-24 md:py-32 px-4 bg-primary text-primary-foreground" ref={ref}>
      <div className="container max-w-3xl mx-auto">
        <div className={`text-center mb-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <HandHeart className="w-9 h-9 text-accent mx-auto mb-4" />
          <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-balance">Send Us a Prayer Request</h2>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto mt-4">
            We believe in the power of standing together in prayer. Share what's on your heart — our intercessors will lift it up.
          </p>
        </div>

        <form
          onSubmit={submit}
          className={`bg-card text-card-foreground rounded-xl p-8 md:p-10 shadow-medium transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}
        >
          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Name {form.anonymous && <span className="text-xs text-muted-foreground font-normal">(hidden)</span>}</label>
              <input
                type="text"
                required={!form.anonymous}
                disabled={form.anonymous}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Email (optional)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold mb-1.5">Your Prayer Request</label>
            <textarea
              required
              rows={5}
              maxLength={1000}
              value={form.request}
              onChange={(e) => setForm({ ...form, request: e.target.value })}
              className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              placeholder="Share what you'd like us to pray about…"
            />
          </div>

          <label className="flex items-center gap-2 text-sm mb-6">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
              className="rounded border-border"
            />
            Submit anonymously
          </label>

          <button
            type="submit"
            className="w-full bg-secondary text-secondary-foreground font-semibold py-4 rounded-full text-base transition-all duration-200 active:scale-[0.97] hover:shadow-medium"
          >
            {submitted ? "✓ Thank you. We're praying with you." : "Send Prayer Request"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default PrayerRequestSection;
