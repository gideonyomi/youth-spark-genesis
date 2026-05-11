const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground pt-20 pb-8 px-4 overflow-hidden">
      {/* Giant wordmark */}
      <div className="container max-w-6xl mx-auto mb-16">
        <h2
          className="font-serif font-bold text-[4rem] sm:text-[6rem] md:text-[8rem] lg:text-[10rem] leading-none tracking-tighter text-center"
          style={{
            WebkitTextStroke: "1px hsl(40, 33%, 96%)",
            WebkitTextFillColor: "transparent",
          }}
        >
          BLHMYOUTH
        </h2>
      </div>

      <div className="container max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 text-sm">
          <div>
            <p className="font-semibold uppercase tracking-wider text-xs text-accent mb-3">Explore</p>
            <div className="flex flex-col gap-2">
              {[
                { l: "About", h: "#about" },
                { l: "Ministries", h: "#ministries" },
                { l: "Leadership", h: "#leadership" },
                { l: "History", h: "#history" },
                { l: "Testimonies", h: "#testimonials" },
              ].map((link) => (
                <a key={link.l} href={link.h} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  {link.l}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold uppercase tracking-wider text-xs text-accent mb-3">Annual Events</p>
            <div className="flex flex-col gap-2">
              <a href="#events" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Youth Empowerment Conference (YEC)
              </a>
              <a href="#events" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Student Success Camp (SSC)
              </a>
              <a href="#events" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                National Singles' Summit (NSS)
              </a>
              <a href="#live" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Watch Live
              </a>
            </div>
          </div>

          <div>
            <p className="font-semibold uppercase tracking-wider text-xs text-accent mb-3">Get Involved</p>
            <div className="flex flex-col gap-2">
              <a href="#join" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Register / Join</a>
              <a href="#share-testimony" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Share a Testimony</a>
              <a href="#prayer" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Prayer Request</a>
              <a href="#contact" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Contact Us</a>
            </div>
          </div>

          <div>
            <p className="font-semibold uppercase tracking-wider text-xs text-accent mb-3">Connect</p>
            <div className="flex flex-col gap-2 text-primary-foreground/70">
              <a href="mailto:info@blhmyec.org" className="hover:text-primary-foreground transition-colors">info@blhmyec.org</a>
              <div className="flex flex-col gap-1.5 mt-2">
                <a href="https://instagram.com/blhmyec" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Instagram · @blhmyec</a>
                <a href="https://twitter.com/blhmyec" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Twitter / X · @blhmyec</a>
                <a href="https://youtube.com/@blhmyec" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">YouTube · @blhmyec</a>
                <a href="https://facebook.com/blhmyec" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Facebook · blhmyec</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-primary-foreground/50">
          <span>© {new Date().getFullYear()} Bible Life Holiness Ministry Youth Department. All rights reserved.</span>
          <span className="mt-2 sm:mt-0">Rooted in Holiness, Empowered for Purpose. — Heb 12:14</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
