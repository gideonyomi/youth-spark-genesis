import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";

const groups = [
  {
    title: "Council Chairman",
    people: [{ name: "To be announced", role: "Council Chairman" }],
  },
  {
    title: "National Executives",
    people: [
      { name: "To be announced", role: "National Youth President" },
      { name: "To be announced", role: "National Secretary" },
      { name: "To be announced", role: "National Coordinator" },
    ],
  },
  {
    title: "State Youth Coordinators",
    people: [
      { name: "To be announced", role: "Lagos State" },
      { name: "To be announced", role: "Oyo State" },
      { name: "To be announced", role: "FCT Abuja" },
      { name: "To be announced", role: "Rivers State" },
    ],
  },
];

const LeadershipSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="leadership" className="py-24 md:py-40 px-4" ref={ref}>
      <div className="container max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">Our Leadership</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance">
            The Team Serving the Youth
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4">
            From the Council Chairman to state coordinators, our leadership is committed to disciple, equip and walk alongside young people.
          </p>
        </div>

        <div className="space-y-12">
          {groups.map((g, gi) => (
            <div key={g.title}>
              <h3 className="font-serif font-semibold text-foreground text-xl mb-5">{g.title}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {g.people.map((p, i) => (
                  <div
                    key={`${g.title}-${i}`}
                    className={`bg-card rounded-xl p-6 shadow-soft transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-3 blur-[4px]"}`}
                    style={{ transitionDelay: visible ? `${gi * 100 + i * 60}ms` : "0ms" }}
                  >
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <User className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="font-serif font-semibold text-card-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{p.role}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10 italic">
          Photos and full bios will be added as the directory is finalised.
        </p>
      </div>
    </section>
  );
};

export default LeadershipSection;
