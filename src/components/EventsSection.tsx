import { useEffect, useRef, useState } from "react";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import yecImage from "@/assets/event-yec.jpg";
import sscImage from "@/assets/event-ssc.jpg";

const events = [
  {
    tag: "YEC",
    title: "Youth Empowerment Conference",
    badge: "🎉 30th Anniversary Edition",
    date: "August 15–18, 2026",
    location: "Main Auditorium, BLHM HQ",
    description: "2026 marks 30 years of YEC! Four transformative days of worship, holiness teaching, and empowerment. Keynote speakers, breakout sessions, and life-changing encounters with God.",
    image: yecImage,
    color: "bg-secondary",
  },
  {
    tag: "SSC",
    title: "Student Success Camp",
    date: "December 20–23, 2026",
    location: "Camp Ground Retreat Center",
    description: "A 4-day camp blending academic mentorship with spiritual growth, rooted in the pursuit of holiness. Workshops, outdoor adventures, and purposeful team-building.",
    image: sscImage,
    color: "bg-accent",
  },
];

const EventsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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

        <div className="grid md:grid-cols-2 gap-8">
          {events.map((event, i) => (
            <div
              key={event.tag}
              className={`group bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-heavy transition-all duration-500 hover:-translate-y-2 ${visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[4px]"}`}
              style={{
                transitionDelay: visible ? `${200 + i * 150}ms` : "0ms",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div className="relative h-56 overflow-hidden">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <span className={`absolute top-4 left-4 ${event.color} text-card font-sans font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full`}>
                  {event.tag}
                </span>
              </div>

              <div className="p-7">
                <h3 className="font-serif font-bold text-2xl text-card-foreground mb-3">{event.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-5">{event.description}</p>

                <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-secondary" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-secondary" />
                    {event.location}
                  </div>
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
