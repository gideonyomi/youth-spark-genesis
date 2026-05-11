import { useEffect, useRef, useState } from "react";

const testimonies = [
  {
    name: "Adaeze O.",
    role: "University student, Lagos",
    text: "Coming to YEC changed how I see my purpose. I left feeling seen, valued, and clear about my next steps — both spiritually and academically.",
    initials: "AO",
  },
  {
    name: "Marcus T.",
    role: "Graduate, Student Success Camp '24",
    text: "SSC gave me mentors who walked with me through a tough season. The friendships I made there are still some of the strongest in my life.",
    initials: "MT",
  },
  {
    name: "Grace N.",
    role: "Teen, Port Harcourt",
    text: "I joined the teenagers' programme nervous and quiet. A year later I'm leading my school fellowship. The church family here actually shows up for you.",
    initials: "GN",
  },
  {
    name: "Samuel I.",
    role: "Young professional, Abuja",
    text: "After years away from church, NSS welcomed me without judgement and helped me rediscover my faith. I found community I didn't know I needed.",
    initials: "SI",
  },
  {
    name: "Tola A.",
    role: "Volunteer, Campus Outreach",
    text: "Serving with the youth on outreach reminded me that the gospel is practical. We fed people, listened to their stories, and saw lives change.",
    initials: "TA",
  },
  {
    name: "Anonymous",
    role: "Camp attendee",
    text: "I came carrying a lot. I left lighter. I won't forget the morning the worship team stopped mid-set to pray for someone they didn't even know — me.",
    initials: "—",
  },
];

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
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
