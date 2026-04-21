import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/hooks/useBranding";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Jobs", href: "/jobs" },
  { label: "Services", href: "/services" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Trust", href: "/trust" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { name, logoUrl } = useBranding();

  const ctaClick = () => {
    navigate(user ? "/dashboard" : "/auth?redirect=/welcome");
    setOpen(false);
  };

  // Split brand name so the last word is gold-accented (e.g. "Steve Safari" → "Steve" + "Safari")
  const parts = name.trim().split(" ");
  const lead = parts.length > 1 ? parts.slice(0, -1).join(" ") : name;
  const accent = parts.length > 1 ? parts[parts.length - 1] : "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoUrl} alt={name} className="h-14 w-14 sm:h-16 sm:w-16 object-contain" />
          <span className="font-heading font-bold text-xl sm:text-2xl text-foreground leading-tight">
            {lead}{accent && <> <span className="text-safari-gold">{accent}</span></>}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.label} to={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
          <Button size="sm" onClick={ctaClick}>{user ? "Dashboard" : "Get Started"}</Button>
        </div>

        <button className="md:hidden p-2 text-foreground" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-card border-b border-border pb-4">
          <div className="container flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground py-2" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Button size="sm" className="w-full mt-2" onClick={ctaClick}>{user ? "Dashboard" : "Get Started"}</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
