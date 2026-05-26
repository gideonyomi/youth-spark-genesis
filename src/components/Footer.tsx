import logo from "@/assets/blhm-logo.png";
import { useSingleton } from "@/hooks/useContent";

const Footer = () => {
  const { data: settings } = useSingleton<any>("site_settings");
  const s = settings?.data ?? {};
  const email = s.email ?? "info@blhmyec.org";
  const phone = s.phone as string | undefined;
  const instagram = s.instagram ?? "@blhmyec";
  const facebook = s.facebook ?? "blhmyec";
  const youtube = s.youtube ?? "@blhmyouth";

  const contactHref = phone
    ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}`
    : `mailto:${email}?subject=BLHMYOUTH%20Enquiry`;

  return (
    <footer className="bg-primary text-primary-foreground pt-20 pb-8 px-4 overflow-hidden">
      {/* Brand block */}
      <div className="container max-w-6xl mx-auto mb-12 flex flex-col items-center gap-6">
        <img src={logo} alt="Bible Life Holiness Ministry logo" className="w-20 h-20 object-contain drop-shadow-lg" />
        <h2
          className="font-serif font-bold text-[3.5rem] sm:text-[5.5rem] md:text-[7.5rem] lg:text-[9rem] leading-none tracking-tighter text-center"
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
                { l: "Leadership", h: "/leadership" },
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
              <a href="#newsletter" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Subscribe to Newsletter</a>
              <a href="#share-testimony" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Share a Testimony</a>
              <a href="#prayer" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Prayer Request</a>
              <a href={contactHref} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Contact Us</a>
            </div>
          </div>

          <div>
            <p className="font-semibold uppercase tracking-wider text-xs text-accent mb-3">Connect</p>
            <div className="flex flex-col gap-2 text-primary-foreground/70">
              <a href={`mailto:${email}`} className="hover:text-primary-foreground transition-colors break-all">{email}</a>
              {phone && (
                <a href={`tel:${phone}`} className="hover:text-primary-foreground transition-colors">{phone}</a>
              )}
              <div className="flex flex-col gap-1.5 mt-2">
                <a href={`https://instagram.com/${String(instagram).replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Instagram · {instagram}</a>
                <a href={`https://facebook.com/${facebook}`} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Facebook · {facebook}</a>
                <a href={`https://youtube.com/${String(youtube).startsWith("@") ? youtube : "@" + youtube}`} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">YouTube · {youtube}</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-primary-foreground/50 gap-2">
          <span>© {new Date().getFullYear()} Bible Life Holiness Ministry Youth Department. All rights reserved.</span>
          <span>Knowing Christ and Making Him Known. — Heb 12:14</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
