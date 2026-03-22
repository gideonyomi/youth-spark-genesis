import { useState, useEffect, useRef } from "react";

const JoinSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    event: "",
    message: "",
  });

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: "", email: "", phone: "", event: "", message: "" });
  };

  return (
    <section id="join" className="py-24 md:py-40 px-4" ref={ref}>
      <div className="container max-w-3xl mx-auto">
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">Join Us</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance mb-4">
            Walk in Holiness With Us
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Join the BLHMYOUTH family or register for YEC 2026 (30th anniversary!) and SSC. Holiness is our watchword — empowerment for purpose is our goal.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`bg-card rounded-xl p-8 md:p-10 shadow-medium transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}
        >
          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-1.5">I'm Interested In</label>
              <select
                value={form.event}
                onChange={(e) => setForm({ ...form, event: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
              >
                <option value="">Select an option</option>
                <option value="yec">YEC — Youth Empowerment Conference</option>
                <option value="ssc">SSC — Student Success Camp</option>
                <option value="membership">General Membership</option>
                <option value="volunteer">Volunteer / Serve</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-card-foreground mb-1.5">Message (Optional)</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-shadow resize-none"
              placeholder="Tell us a little about yourself…"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-secondary text-secondary-foreground font-semibold py-4 rounded-full text-base transition-all duration-200 active:scale-[0.97] hover:shadow-medium"
          >
            {submitted ? "✓ Submitted! We'll be in touch." : "Submit Registration"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default JoinSection;
