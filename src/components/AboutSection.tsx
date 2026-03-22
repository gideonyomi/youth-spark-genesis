import { useEffect, useRef, useState } from "react";
import studyImage from "@/assets/programs-study.jpg";

const AboutSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="about" className="py-24 md:py-40 px-4" ref={ref}>
      <div className="container max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div
          className={`transition-all duration-700 ${visible ? "opacity-100 translate-x-0 blur-0" : "opacity-0 -translate-x-6 blur-[4px]"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">About Us</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl mb-6 text-balance">
            Holiness Is Our Watchword
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-4">
            The Bible Life Holiness Ministry Youth Department (BLHMYOUTH) is the youth arm of Bible Life Holiness Ministry — a vibrant community of young believers pursuing holiness as a lifestyle and empowerment as a mandate.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            Anchored on Hebrews 12:14 — <em>"Follow peace with all men, and holiness, without which no man shall see the Lord"</em> — we are committed to raising kingdom citizens who walk in purity, serve with purpose, and lead with the fire of the Holy Spirit.
          </p>
          <div className="grid grid-cols-2 gap-6 mt-8">
            {[
              { label: "Our Vision", value: "To see every young person walk in the fullness of God's purpose." },
              { label: "Our Mission", value: "Disciple, train, and deploy young leaders for kingdom impact." },
            ].map((item) => (
              <div key={item.label} className="border-l-2 border-accent pl-4">
                <p className="font-sans font-semibold text-sm uppercase tracking-wide text-foreground mb-1">{item.label}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.value}</p>
              </div>
            ))}
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
          <div className="absolute -bottom-6 -left-6 bg-accent text-accent-foreground font-serif font-bold text-lg px-6 py-4 rounded-lg shadow-soft">
            Est. 2005
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
