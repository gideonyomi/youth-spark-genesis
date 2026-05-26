import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

const NewsletterSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return toast.error("Please enter a valid email");
    if (clean.length > 255) return toast.error("Email is too long");
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: clean });
    setBusy(false);
    if (error) {
      if ((error as any).code === "23505") {
        toast.info("You're already subscribed — thank you!");
        setDone(true);
        return;
      }
      return toast.error("Could not subscribe. Please try again.");
    }
    setDone(true);
    setEmail("");
    toast.success("Subscribed! Watch your inbox.");
  };

  return (
    <section id="newsletter" className="py-24 md:py-36 px-4" ref={ref}>
      <div className="container max-w-3xl mx-auto">
        <div
          className={`relative bg-primary text-primary-foreground rounded-3xl p-8 md:p-14 overflow-hidden shadow-medium transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-secondary/25 blur-3xl" aria-hidden />

          <div className="relative text-center max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent bg-accent/10 border border-accent/30 px-3 py-1.5 rounded-full mb-5">
              <Mail className="w-3.5 h-3.5" /> Stay Connected
            </div>
            <h2 className="font-serif font-bold text-3xl md:text-5xl text-balance leading-[1.05]">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-primary-foreground/75 mt-4 text-base md:text-lg leading-relaxed">
              Get the latest events, devotionals, and ministry updates from BLHMYOUTH delivered straight to your inbox.
            </p>

            <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                maxLength={255}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-5 py-3.5 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent focus:bg-primary-foreground/15 transition-all"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-semibold px-7 py-3.5 rounded-full text-sm hover:shadow-medium transition-all active:scale-[0.97] disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <CheckCircle2 className="w-4 h-4" /> : null}
                {busy ? "Subscribing…" : done ? "Subscribed" : "Subscribe"}
              </button>
            </form>

            <p className="text-xs text-primary-foreground/50 mt-4">
              We respect your inbox. Unsubscribe any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
