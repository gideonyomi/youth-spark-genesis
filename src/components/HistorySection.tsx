import { useEffect, useRef, useState } from "react";
import { useCollection } from "@/hooks/useContent";

const HistorySection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { data: themes = [] } = useCollection<any>("history_milestones");

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="history" className="py-24 md:py-40 px-4 bg-muted/40" ref={ref}>
      <div className="container max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">YEC Through the Years</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance">
            Three Decades of YEC Themes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4">
            Every edition of the Youth Empowerment Conference has carried a word for its season.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-border sm:-translate-x-1/2" aria-hidden />
          <ol className="space-y-6">
            {themes.map((t, i) => {
              const left = i % 2 === 0;
              const isAnniversary = /anniversary/i.test(t.theme || "");
              return (
                <li
                  key={t.id}
                  className={`relative pl-12 sm:pl-0 sm:grid sm:grid-cols-2 sm:gap-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-3 blur-[4px]"}`}
                  style={{ transitionDelay: visible ? `${Math.min(i * 30, 600)}ms` : "0ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                  <span
                    className={`absolute left-4 sm:left-1/2 top-3 w-3 h-3 rounded-full -translate-x-1/2 ring-4 ring-muted/40 ${isAnniversary ? "bg-secondary" : "bg-accent"}`}
                    aria-hidden
                  />
                  <div className={`bg-card rounded-xl p-5 shadow-soft ${left ? "sm:text-right sm:pr-10 sm:col-start-1" : "sm:text-left sm:pl-10 sm:col-start-2"}`}>
                    <p className={`font-sans text-xs font-semibold uppercase tracking-[0.12em] ${isAnniversary ? "text-secondary" : "text-accent"}`}>
                      {t.year}
                    </p>
                    <h3 className="font-serif font-semibold text-card-foreground text-xl mt-1">{t.theme}</h3>
                    {t.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t.description}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default HistorySection;
