import { useEffect, useRef, useState } from "react";

const themes = [
  { year: 1994, theme: "Fire Conference" },
  { year: 1996, theme: "Triumph" },
  { year: 1997, theme: "Great Awakening" },
  { year: 1998, theme: "Overcomer" },
  { year: 2000, theme: "Jubilee" },
  { year: 2001, theme: "Zion" },
  { year: 2003, theme: "Destiny Flight" },
  { year: 2004, theme: "Jesus; His Likeness, His Fullness & His Freshness" },
  { year: 2005, theme: "Resurgence" },
  { year: 2006, theme: "Higher Ground" },
  { year: 2007, theme: "Advance" },
  { year: 2008, theme: "Exploit" },
  { year: 2009, theme: "Glory" },
  { year: 2010, theme: "Manifestation" },
  { year: 2011, theme: "Greater Heights" },
  { year: 2012, theme: "Vision" },
  { year: 2013, theme: "Beyond Limit" },
  { year: 2014, theme: "Landmark" },
  { year: 2015, theme: "Extraordinary Experience" },
  { year: 2016, theme: "Transformation" },
  { year: 2017, theme: "On Eagle's Wing" },
  { year: 2018, theme: "Shift" },
  { year: 2019, theme: "The Leading Lights" },
  { year: 2020, theme: "Step Up" },
  { year: 2021, theme: "Renewal" },
  { year: 2022, theme: "Cutting Edge" },
  { year: 2023, theme: "Dunamis" },
  { year: 2024, theme: "Harvest Fire" },
  { year: 2025, theme: "Radiance" },
  { year: 2026, theme: "Emergence", anniversary: true },
];

const HistorySection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="history" className="py-24 md:py-40 px-4 bg-muted/40" ref={ref}>
      <div className="container max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">YEC 1994 — 2026</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance">
            Thirty Years of YEC Themes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4">
            Every edition of the Youth Empowerment Conference has carried a word for its season. Here is the journey — from Fire Conference in 1994 to Emergence in 2026.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-border sm:-translate-x-1/2" aria-hidden />
          <ol className="space-y-6">
            {themes.map((t, i) => {
              const left = i % 2 === 0;
              return (
                <li
                  key={t.year}
                  className={`relative pl-12 sm:pl-0 sm:grid sm:grid-cols-2 sm:gap-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-3 blur-[4px]"}`}
                  style={{ transitionDelay: visible ? `${Math.min(i * 30, 600)}ms` : "0ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                  <span
                    className={`absolute left-4 sm:left-1/2 top-3 w-3 h-3 rounded-full -translate-x-1/2 ring-4 ring-muted/40 ${t.anniversary ? "bg-secondary" : "bg-accent"}`}
                    aria-hidden
                  />
                  <div className={`bg-card rounded-xl p-5 shadow-soft sm:col-start-${left ? 1 : 2} ${left ? "sm:text-right sm:pr-10" : "sm:text-left sm:pl-10 sm:col-start-2"}`}>
                    <p className={`font-sans text-xs font-semibold uppercase tracking-[0.12em] ${t.anniversary ? "text-secondary" : "text-accent"}`}>
                      {t.year}{t.anniversary && " · 30th Anniversary"}
                    </p>
                    <h3 className="font-serif font-semibold text-card-foreground text-xl mt-1">{t.theme}</h3>
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
