import { useEffect, useRef, useState } from "react";
import studyImage from "@/assets/programs-study.jpg";
import { useSingleton } from "@/hooks/useContent";

const AboutSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { data } = useSingleton<any>("about_content");

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const eyebrow = data?.eyebrow ?? "About BLHMYOUTH";
  const headline = data?.headline ?? "Holiness Is Our Watchword";
  const body = data?.body ?? "The Bible Life Holiness Ministry Youth Department (BLHMYOUTH) is the youth arm of Bible Life Holiness Ministry — a vibrant community of young believers pursuing holiness as a lifestyle and empowerment as a mandate.";
  const watchword = data?.watchword ?? "Holiness is our watchword. Empowerment for purpose is our goal.";
  const scripture = data?.scripture ?? 'Hebrews 12:14 — "Follow peace with all men, and holiness, without which no man shall see the Lord."';

  return (
    <section id="about" className="py-24 md:py-40 px-4" ref={ref}>
      <div className="container max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div
          className={`transition-all duration-700 ${visible ? "opacity-100 translate-x-0 blur-0" : "opacity-0 -translate-x-6 blur-[4px]"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">{eyebrow}</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl mb-6 text-balance">
            {headline}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-4 whitespace-pre-line">
            {body}
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6 italic">
            {scripture}
          </p>
          <div className="border-l-2 border-accent pl-4 mt-6">
            <p className="font-sans font-semibold text-sm uppercase tracking-wide text-foreground mb-1">Our Watchword</p>
            <p className="text-muted-foreground text-sm leading-relaxed">{watchword}</p>
          </div>
        </div>

        <div
          className={`relative transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-x-0 blur-0" : "opacity-0 translate-x-6 blur-[4px]"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <img
            src={studyImage}
            alt="Youth Bible study session outdoors at golden hour"
            className="rounded-xl w-full aspect-[4/5] object-cover shadow-medium"
          />
          <div className="absolute -bottom-6 -left-6 bg-accent text-accent-foreground font-serif font-bold text-sm px-5 py-3 rounded-lg shadow-soft text-center leading-tight">
            Hebrews 12:14
            <span className="block text-xs font-sans font-normal mt-0.5 opacity-80">Holiness — our watchword</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
