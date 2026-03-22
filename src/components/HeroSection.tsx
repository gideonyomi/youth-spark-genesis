import heroImage from "@/assets/hero-worship.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Youth worshipping together at BLHMYOUTH conference"
          className="w-full h-full object-cover animate-clip-open"
          style={{ animationDelay: "400ms" }}
        />
        <div className="absolute inset-0 bg-primary/70" />
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <p
          className="font-sans text-sm font-semibold uppercase tracking-[0.15em] text-accent mb-6 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          Bible Life Holiness Ministry Youth Department
        </p>

        <h1
          className="font-serif font-bold text-primary-foreground text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] text-balance animate-fade-up"
          style={{ animationDelay: "200ms", lineHeight: "0.9" }}
        >
          Rooted in Holiness,
          <br />
          <span className="text-accent">Empowered for Purpose</span>
        </h1>

        <p
          className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mt-8 animate-fade-up"
          style={{ animationDelay: "500ms" }}
        >
          "Follow peace with all men, and holiness, without which no man shall see the Lord." — Hebrews 12:14. We are raising a generation set apart for God's purpose.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-up"
          style={{ animationDelay: "650ms" }}
        >
          <a
            href="#events"
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-8 py-4 rounded-full text-base transition-all duration-200 active:scale-[0.97] shadow-medium"
          >
            Upcoming Events
          </a>
          <a
            href="#about"
            className="border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8 py-4 rounded-full text-base transition-all duration-200 active:scale-[0.97]"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-fade-up" style={{ animationDelay: "1000ms" }}>
        <div className="w-6 h-10 border-2 border-primary-foreground/40 rounded-full flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 bg-primary-foreground/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
