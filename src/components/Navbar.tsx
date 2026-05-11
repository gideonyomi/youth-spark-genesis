import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Ministries", href: "#ministries" },
  { label: "Events", href: "#events" },
  { label: "History", href: "#history" },
  { label: "Stories", href: "#testimonials" },
  { label: "Prayer", href: "#prayer" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      {/* Desktop pill */}
      <div className="hidden md:flex items-center gap-1 bg-primary/95 backdrop-blur-md rounded-full px-2 py-2 shadow-heavy">
        <a href="#" className="font-serif font-bold text-primary-foreground px-4 text-lg tracking-tight">
          BLHMYOUTH
        </a>
        <div className="w-px h-5 bg-primary-foreground/20" />
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-primary-foreground/80 hover:text-primary-foreground text-sm font-medium px-3 py-2 rounded-full transition-colors duration-200 hover:bg-primary-foreground/10"
          >
            {link.label}
          </a>
        ))}
        <a
          href="#join"
          className="bg-secondary text-secondary-foreground font-semibold text-sm px-5 py-2 rounded-full ml-1 transition-transform duration-150 active:scale-[0.97]"
        >
          Register
        </a>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center gap-3 bg-primary/95 backdrop-blur-md rounded-full px-4 py-3 shadow-heavy">
        <span className="font-serif font-bold text-primary-foreground text-lg">BLHMYOUTH</span>
        <button
          onClick={() => setOpen(!open)}
          className="text-primary-foreground ml-auto"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden mt-2 bg-primary/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-heavy flex flex-col gap-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-primary-foreground/80 hover:text-primary-foreground text-base font-medium py-2 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#join"
            onClick={() => setOpen(false)}
            className="bg-secondary text-secondary-foreground font-semibold text-sm px-5 py-3 rounded-full text-center mt-2 active:scale-[0.97] transition-transform"
          >
            Register Now
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
