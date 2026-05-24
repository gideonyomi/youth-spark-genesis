import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { useSingleton } from "@/hooks/useContent";

const GeneralOverseerSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { data } = useSingleton<any>("general_overseer");

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const name = data?.name ?? "General Overseer";
  const title = data?.title ?? "Bible Life Holiness Ministry";
  const bio = data?.bio ?? "";
  const quote = data?.quote ?? "A steady, fatherly voice calling this generation to the highway of holiness.";
  const photo = data?.photo_url;

  return (
    <section id="go" className="py-24 md:py-32 px-4" ref={ref}>
      <div className="container max-w-5xl mx-auto grid md:grid-cols-[1fr_1.3fr] gap-10 md:gap-16 items-center">
        <div
          className={`relative transition-all duration-700 ${visible ? "opacity-100 translate-x-0 blur-0" : "opacity-0 -translate-x-6 blur-[4px]"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="aspect-[4/5] w-full rounded-xl bg-muted shadow-medium flex items-center justify-center overflow-hidden">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-20 h-20 text-muted-foreground/40" />
            )}
          </div>
          {!photo && (
            <div className="absolute -bottom-4 -right-4 bg-accent text-accent-foreground font-serif font-bold text-xs px-4 py-2 rounded-lg shadow-soft">
              Photo coming soon
            </div>
          )}
        </div>

        <div
          className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-x-0 blur-0" : "opacity-0 translate-x-6 blur-[4px]"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">Our General Overseer</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance mb-3">
            {name}
          </h2>
          <p className="text-muted-foreground/80 text-sm uppercase tracking-wider mb-6">{title}</p>
          {bio && <p className="text-muted-foreground text-lg leading-relaxed mb-4 whitespace-pre-line">{bio}</p>}
          {quote && (
            <blockquote className="border-l-2 border-accent pl-5 italic text-foreground/80 font-serif text-lg leading-relaxed">
              "{quote}"
            </blockquote>
          )}
        </div>
      </div>
    </section>
  );
};

export default GeneralOverseerSection;
