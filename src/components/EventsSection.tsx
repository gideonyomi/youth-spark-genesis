import { useEffect, useRef, useState } from "react";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import yecImage from "@/assets/event-yec.jpg";
import sscImage from "@/assets/event-ssc.jpg";
import nssImage from "@/assets/gallery-1.jpg";
import { useCollection } from "@/hooks/useContent";

const FALLBACK_IMAGES: Record<string, string> = { YEC: yecImage, SSC: sscImage, NSS: nssImage };
const TAG_COLORS: Record<string, string> = { YEC: "bg-secondary", SSC: "bg-accent", NSS: "bg-primary" };

const EventsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { data: events = [] } = useCollection<any>("events", { onlyPublished: true });

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="events" className="py-24 md:py-40 px-4" ref={ref}>
      <div className="container max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}>
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-secondary mb-4">Annual Events</p>
          <h2 className="font-serif font-bold text-foreground text-3xl sm:text-4xl md:text-5xl text-balance">
            Mark Your Calendar
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4">Where holiness meets empowerment — gatherings that transform lives and ignite purpose.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => {
            const img = event.image_url || FALLBACK_IMAGES[event.tag] || yecImage;
            const color = TAG_COLORS[event.tag] || "bg-primary";
            return (
              <div
                key={event.id}
                className={`group bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-heavy transition-all duration-500 hover:-translate-y-2 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}
                style={{
                  transitionDelay: visible ? `${200 + i * 150}ms` : "0ms",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img src={img} alt={event.title} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" />
                  <span className={`absolute top-4 left-4 ${color} text-card font-sans font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full`}>
                    {event.tag}
                  </span>
                  {event.badge && (
                    <span className="absolute top-4 right-4 bg-card text-secondary font-sans font-bold text-xs px-3 py-1.5 rounded-full shadow-soft">
                      {event.badge}
                    </span>
                  )}
                </div>

                <div className="p-7">
                  <h3 className="font-serif font-bold text-2xl text-card-foreground mb-3">{event.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-5">{event.description}</p>

                  <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-6">
                    {event.date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-secondary" />
                        {event.date}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-secondary" />
                        {event.location}
                      </div>
                    )}
                  </div>

                  <a
                    href="#join"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full text-sm transition-all duration-200 active:scale-[0.97] group-hover:gap-3"
                  >
                    Register for {event.tag}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
