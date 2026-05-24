import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCollection } from "@/hooks/useContent";

const FALLBACK = [
  { id: "f1", name: "Adaeze O.", location: "University student, Lagos", quote: "Coming to YEC changed how I see my purpose. I left feeling seen, valued, and clear about my next steps — both spiritually and academically." },
  { id: "f2", name: "Marcus T.", location: "Graduate, SSC '24", quote: "SSC gave me mentors who walked with me through a tough season. The friendships I made there are still some of the strongest in my life." },
  { id: "f3", name: "Grace N.", location: "Teen, Port Harcourt", quote: "I joined the teenagers' programme nervous and quiet. A year later I'm leading my school fellowship." },
];

const initialsOf = (name: string) =>
  name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "—";



const TestimoniesSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", story: "" });

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("testimony_submissions").insert({
      name: form.name, location: form.location || null, story: form.story,
    });
    if (error) return toast.error("Could not submit. Please try again.");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: "", location: "", story: "" });
  };


  return (
    <section id="testimonials" className="py-24 md:py-40 px-4 bg-muted/50" ref={ref}>
      <div className="container max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">Stories From Our Community</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance">
            Real People, Real Stories
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4">
            Students, professionals, teens, volunteers — these are the everyday voices of the BLHMYOUTH family.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {testimonies.map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className={`bg-card rounded-xl p-7 shadow-soft transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-3 blur-[4px]"}`}
              style={{ transitionDelay: visible ? `${i * 80}ms` : "0ms" }}
            >
              <p className="text-muted-foreground leading-relaxed mb-6 italic font-serif text-lg">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-sm text-card-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div id="share-testimony" className="bg-card rounded-xl p-8 md:p-10 shadow-medium max-w-2xl mx-auto">
          <h3 className="font-serif font-bold text-2xl text-card-foreground mb-2">Share Your Story</h3>
          <p className="text-muted-foreground mb-6">
            Has God done something in your life through this community? Tell us — we'd love to celebrate with you.
          </p>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Your name (or 'Anonymous')"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-1.5">Location / Chapter</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g. Lagos, Campus fellowship"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">Your Testimony</label>
              <textarea
                required
                rows={5}
                maxLength={1500}
                value={form.story}
                onChange={(e) => setForm({ ...form, story: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                placeholder="Tell us what happened…"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-secondary text-secondary-foreground font-semibold py-4 rounded-full text-base transition-all duration-200 active:scale-[0.97] hover:shadow-medium"
            >
              {submitted ? "✓ Thank you for sharing!" : "Submit Testimony"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default TestimoniesSection;
