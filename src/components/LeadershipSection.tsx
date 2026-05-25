import { useEffect, useMemo, useRef, useState } from "react";
import { User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCollection } from "@/hooks/useContent";

const LeadershipSection = ({ preview = false }: { preview?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { data: people = [] } = useCollection<any>("leadership");

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const groups = useMemo(() => {
    const acc: Record<string, any[]> = {};
    const order: string[] = [];
    for (const p of people) {
      if (!acc[p.group_name]) { acc[p.group_name] = []; order.push(p.group_name); }
      acc[p.group_name].push(p);
    }
    const all = order.map((title) => ({ title, people: acc[title] }));
    if (!preview) return all;
    // Preview: show first group only, max 4 people
    return all.slice(0, 1).map((g) => ({ ...g, people: g.people.slice(0, 4) }));
  }, [people, preview]);

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
                    key={p.id}
                    className={`bg-card rounded-xl p-6 shadow-soft transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-3 blur-[4px]"}`}
                    style={{ transitionDelay: visible ? `${gi * 100 + i * 60}ms` : "0ms" }}
                  >
                    <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center mb-4">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-serif font-semibold text-card-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{p.role}</p>
                    {p.bio && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.bio}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {preview && (
          <div className="text-center mt-14">
            <Link
              to="/leadership"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-full transition-transform duration-150 active:scale-[0.97] hover:gap-3"
            >
              Meet the full leadership <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default LeadershipSection;
