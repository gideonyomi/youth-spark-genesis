import { useEffect, useRef, useState } from "react";
import { BookOpen, Users, Heart, Mic } from "lucide-react";

const programs = [
  {
    icon: BookOpen,
    title: "Bible Study & Discipleship",
    description: "Weekly deep dives into God's Word, building a firm scriptural foundation for every young believer.",
  },
  {
    icon: Users,
    title: "Leadership Development",
    description: "Mentorship programs and workshops that cultivate servant-leaders ready to transform their spheres of influence.",
  },
  {
    icon: Heart,
    title: "Community Outreach",
    description: "Hands-on service projects that put faith into action — feeding the hungry, visiting the sick, caring for the vulnerable.",
  },
  {
    icon: Mic,
    title: "Creative Arts & Worship",
    description: "Music, drama, spoken word, and multimedia — channels for young creatives to glorify God with their gifts.",
  },
];

const ProgramsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="programs" className="py-24 md:py-40 px-4 bg-primary" ref={ref}>
      <div className="container max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-accent mb-4">Our Programs</p>
          <h2 className="font-serif font-bold text-primary-foreground text-3xl sm:text-4xl md:text-5xl text-balance">
            Building Kingdom Citizens
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {programs.map((prog, i) => (
            <div
              key={prog.title}
              className={`group bg-card rounded-xl p-8 transition-all duration-700 hover:shadow-heavy hover:-translate-y-2 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}
              style={{
                transitionDelay: visible ? `${200 + i * 100}ms` : "0ms",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div className="w-12 h-12 rounded-lg bg-accent/15 flex items-center justify-center mb-5 group-hover:bg-accent/25 transition-colors">
                <prog.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-serif font-semibold text-xl text-card-foreground mb-3">{prog.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{prog.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
