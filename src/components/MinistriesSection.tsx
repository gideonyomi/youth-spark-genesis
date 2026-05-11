import { useEffect, useRef, useState } from "react";
import { MapPin, GraduationCap, Globe2, Sparkles, BookMarked, Megaphone, Tent } from "lucide-react";

const ministries = [
  {
    icon: MapPin,
    title: "State Programmes",
    description: "Local gatherings, retreats and outreaches led by our state chapters across the country.",
  },
  {
    icon: GraduationCap,
    title: "School of Ministry & Rescue Mission",
    description: "Training young believers for ministry, evangelism and reaching the lost in our communities.",
  },
  {
    icon: Globe2,
    title: "Missions & Outreach",
    description: "Taking the gospel beyond our walls through mission trips, community service and partnerships.",
  },
  {
    icon: Sparkles,
    title: "Teenagers' Programme",
    description: "A dedicated space for teens — mentorship, fellowship and discipleship that meets them where they are.",
  },
  {
    icon: BookMarked,
    title: "Campus Corners & Fellowships",
    description: "Vibrant fellowships on university and college campuses, building Christ-centred community in academic spaces.",
  },
  {
    icon: Megaphone,
    title: "NYC Corner",
    description: "Updates, announcements and resources from the National Youth Council to keep every member informed.",
  },
  {
    icon: Tent,
    title: "Youth Camp Ground",
    description: "Our retreat ground for camps, workshops and intensives. Booking and visit info coming soon.",
  },
];

const MinistriesSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="ministries" className="py-24 md:py-40 px-4 bg-muted/40" ref={ref}>
      <div className="container max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">Ministries & Programmes</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance">
            Where We Are at Work
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4">
            From state chapters to campus corners, here are the spaces where the youth department serves and grows together.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ministries.map((m, i) => (
            <div
              key={m.title}
              className={`bg-card rounded-xl p-7 shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-500 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-3 blur-[4px]"}`}
              style={{ transitionDelay: visible ? `${i * 70}ms` : "0ms" }}
            >
              <div className="w-11 h-11 rounded-lg bg-accent/15 flex items-center justify-center mb-4">
                <m.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-serif font-semibold text-lg text-card-foreground mb-2">{m.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MinistriesSection;
