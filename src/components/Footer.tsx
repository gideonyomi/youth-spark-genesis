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
        <div className="grid sm:grid-cols-3 gap-8 mb-12 text-sm">
          <div>
            <p className="font-semibold uppercase tracking-wider text-xs text-accent mb-3">Quick Links</p>
            <div className="flex flex-col gap-2">
              {["About", "Programs", "Events", "Testimonials", "Join"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {link}
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
            </div>
          </div>

          <div>
            <p className="font-semibold uppercase tracking-wider text-xs text-accent mb-3">Connect</p>
            <div className="flex flex-col gap-2 text-primary-foreground/70">
              <span>info@blhmyouth.org</span>
              <span>+1 (555) 012-3456</span>
              <div className="flex gap-4 mt-2">
                {["Facebook", "Instagram", "YouTube"].map((social) => (
                  <a key={social} href="#" className="hover:text-accent transition-colors text-sm">
                    {social}
                  </a>
                ))}
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
