import heroImage from "@/assets/hero-worship.jpg";
import { useSingleton } from "@/hooks/useContent";

const HeroSection = () => {
  const { data } = useSingleton<any>("hero_content");

  const eyebrow = data?.eyebrow ?? "Bible Life Holiness Ministry Youth Department";
  const headline = data?.headline ?? "Knowing Christ and Making Him Known";
  const subhead = data?.subhead ?? '"Follow peace with all men, and holiness, without which no man shall see the Lord." — Hebrews 12:14. We are raising a generation set apart for God\'s purpose.';
  const ctaPrimaryLabel = data?.cta_primary_label ?? "Upcoming Events";
  const ctaPrimaryLink = data?.cta_primary_link ?? "#events";
  const ctaSecondaryLabel = data?.cta_secondary_label ?? "Learn More";
  const ctaSecondaryLink = data?.cta_secondary_link ?? "#about";
  const image = data?.image_url || heroImage;

  // Split headline on " and " for emphasis, falling back to comma split or single line
  const andMatch = headline.match(/^(.*?)\s+(and|And|AND)\s+(.*)$/);
  const headlineParts = andMatch ? [andMatch[1], andMatch[3]] : (headline.includes(",") ? headline.split(/,(.+)/).filter(Boolean) : [headline]);
  const joiner = andMatch ? " and" : ",";

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-16">
      <div className="absolute inset-0">
        <img
          src={image}
          alt="Youth worshipping together at BLHMYOUTH conference"
          className="w-full h-full object-cover object-top animate-clip-open"
          style={{ animationDelay: "400ms" }}
        />
        <div className="absolute inset-0 bg-primary/70" />
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <p className="font-sans text-sm font-semibold uppercase tracking-[0.15em] text-accent mb-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
          {eyebrow}
        </p>

        <h1 className="font-serif font-bold text-primary-foreground text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] text-balance animate-fade-up" style={{ animationDelay: "200ms", lineHeight: "0.9" }}>
          {headlineParts.length > 1 ? (
            <>
              {headlineParts[0]}{joiner}<br />
              <span className="text-accent">{headlineParts[1].trim()}</span>
            </>
          ) : (
            headline
          )}
        </h1>

        <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mt-8 animate-fade-up" style={{ animationDelay: "500ms" }}>
          {subhead}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-up" style={{ animationDelay: "650ms" }}>
          <a href={ctaPrimaryLink} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-8 py-4 rounded-full text-base transition-all duration-200 active:scale-[0.97] shadow-medium">
            {ctaPrimaryLabel}
          </a>
          <a href={ctaSecondaryLink} className="border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8 py-4 rounded-full text-base transition-all duration-200 active:scale-[0.97]">
            {ctaSecondaryLabel}
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-fade-up" style={{ animationDelay: "1000ms" }}>
        <div className="w-6 h-10 border-2 border-primary-foreground/40 rounded-full flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 bg-primary-foreground/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
