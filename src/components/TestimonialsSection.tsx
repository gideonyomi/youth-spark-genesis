import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    name: "Adaeze Okafor",
    role: "YEC 2025 Attendee",
    text: "The Youth Empowerment Conference changed the trajectory of my life. I discovered my purpose and found a community that truly cares about my spiritual growth.",
    initials: "AO",
  },
  {
    name: "Marcus Thompson",
    role: "Student Success Camp Graduate",
    text: "SSC gave me the tools to excel both in my studies and in my walk with God. The mentors poured into me in ways I'll never forget.",
    initials: "MT",
  },
  {
    name: "Grace Nwosu",
    role: "Youth Leader, Lagos Chapter",
    text: "Serving in BLHMYOUTH has shaped me into the leader I am today. Every program is intentional, every lesson is transformative.",
    initials: "GN",
  },
];

const TestimonialsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="testimonials" className="py-24 md:py-40 px-4 bg-muted/50" ref={ref}>
      <div className="container max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">Testimonials</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance">
            Lives Transformed
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`bg-card rounded-xl p-8 shadow-soft transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}
              style={{
                transitionDelay: visible ? `${200 + i * 100}ms` : "0ms",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <p className="text-muted-foreground leading-relaxed mb-6 italic font-serif text-lg">
                "{t.text}"
              </p>
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
      </div>
    </section>
  );
};

export default TestimonialsSection;
