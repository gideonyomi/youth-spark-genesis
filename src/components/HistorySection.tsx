import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useCollection } from "@/hooks/useContent";

const HistorySection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { data: themes = [] } = useCollection<any>("history_milestones");

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const sorted = [...themes].sort((a, b) => Number(a.year) - Number(b.year));
  const anniversary = sorted.find((t) => /anniversary/i.test(t.theme || "") || /anniversary/i.test(t.description || ""));
  const rest = sorted.filter((t) => t !== anniversary);

  return (
    <section id="history" className="py-24 md:py-40 px-4 bg-muted/40" ref={ref}>
      <div className="container max-w-6xl mx-auto">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">YEC Through the Years</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance">
            Three Decades of YEC Themes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4">
            From the Fire Conference of 1994 to Emergence in 2026 — every edition has carried a word for its season.
          </p>
        </div>

        {anniversary && (
          <div
            className={`relative mb-16 rounded-3xl overflow-hidden bg-primary text-primary-foreground p-8 md:p-12 shadow-medium transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-4 blur-[4px]"}`}
            style={{ transitionDelay: visible ? "120ms" : "0ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-accent/20 blur-3xl" aria-hidden />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-secondary/30 blur-3xl" aria-hidden />
            <div className="relative grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-center">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent bg-accent/10 border border-accent/30 px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" /> 30th Anniversary
                </div>
                <p className="font-serif font-bold text-6xl md:text-7xl lg:text-8xl mt-4 tabular-nums tracking-tighter">
                  {anniversary.year}
                </p>
              </div>
              <div>
                <h3 className="font-serif font-bold text-3xl md:text-5xl leading-[1.05] text-balance">
                  {String(anniversary.theme).replace(/—.*$/, "").trim()}
                </h3>
                {anniversary.description && (
                  <p className="text-primary-foreground/80 mt-4 text-base md:text-lg max-w-xl leading-relaxed">
                    {anniversary.description}
                  </p>
                )}
                <a
                  href="#events"
                  className="inline-flex items-center gap-2 mt-6 bg-accent text-accent-foreground font-semibold px-6 py-3 rounded-full text-sm hover:shadow-medium transition-all active:scale-[0.97]"
                >
                  Be part of the milestone
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {rest.map((t, i) => (
            <article
              key={t.id}
              className={`group relative bg-card border border-border rounded-2xl p-5 hover:shadow-medium hover:-translate-y-0.5 transition-all duration-300 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-3 blur-[4px]"}`}
              style={{
                transitionDelay: visible ? `${Math.min(180 + i * 25, 900)}ms` : "0ms",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">YEC</p>
              <p className="font-serif font-bold text-2xl md:text-3xl text-card-foreground tabular-nums mt-1 leading-none">
                {t.year}
              </p>
              <div className="w-8 h-px bg-border my-3 group-hover:bg-accent transition-colors" aria-hidden />
              <h3 className="font-serif font-semibold text-card-foreground text-base leading-snug text-balance">
                {t.theme}
              </h3>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">{t.description}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HistorySection;
