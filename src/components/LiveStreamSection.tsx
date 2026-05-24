import { useEffect, useRef, useState } from "react";
import { Youtube, Facebook, Instagram, Radio, Twitter, Globe, type LucideIcon } from "lucide-react";
import { useCollection } from "@/hooks/useContent";

const ICONS: Record<string, LucideIcon> = {
  youtube: Youtube,
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
};

const LiveStreamSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { data: channels = [] } = useCollection<any>("livestream_links");

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="live" className="py-24 md:py-32 px-4" ref={ref}>
      <div className="container max-w-5xl mx-auto">
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <Radio className="w-3.5 h-3.5" /> Watch Live
          </div>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance">
            Join Our Live Broadcasts
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mt-4">
            Tune in during conferences, camps and special services on any of our official channels.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {channels.map((c, i) => {
            const Icon = ICONS[c.platform?.toLowerCase()] ?? Globe;
            return (
              <a
                key={c.id}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group bg-card rounded-xl p-7 shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-500 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-3 blur-[4px]"}`}
                style={{ transitionDelay: visible ? `${i * 80}ms` : "0ms" }}
              >
                <Icon className="w-7 h-7 text-secondary mb-4" />
                <p className="font-serif font-semibold text-card-foreground text-lg">{c.platform}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.handle}</p>
                <p className="text-xs text-accent font-semibold uppercase tracking-wider mt-4 group-hover:underline">Open channel →</p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LiveStreamSection;
