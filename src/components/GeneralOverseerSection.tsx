import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";

const GeneralOverseerSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="go" className="py-24 md:py-32 px-4" ref={ref}>
      <div className="container max-w-5xl mx-auto grid md:grid-cols-[1fr_1.3fr] gap-10 md:gap-16 items-center">
        <div
          className={`relative transition-all duration-700 ${visible ? "opacity-100 translate-x-0 blur-0" : "opacity-0 -translate-x-6 blur-[4px]"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="aspect-[4/5] w-full rounded-xl bg-muted shadow-medium flex items-center justify-center overflow-hidden">
            <User className="w-20 h-20 text-muted-foreground/40" />
          </div>
          <div className="absolute -bottom-4 -right-4 bg-accent text-accent-foreground font-serif font-bold text-xs px-4 py-2 rounded-lg shadow-soft">
            Photo coming soon
          </div>
        </div>

        <div
          className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-x-0 blur-0" : "opacity-0 translate-x-6 blur-[4px]"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">Our General Overseer</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance mb-6">
            Under His Spiritual Covering
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-4">
            The youth department operates under the spiritual leadership and pastoral covering of the General Overseer of Bible Life Holiness Ministry.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            His vision for a generation that walks uprightly before God shapes everything we do — the conferences we host, the leaders we raise, and the communities we serve.
          </p>
        </div>
      </div>
    </section>
  );
};

export default GeneralOverseerSection;
