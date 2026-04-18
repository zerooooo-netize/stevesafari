import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Jobs", href: "/jobs" },
  { label: "Services", href: "/services" },
  { label: "How It Works", href: "/how-it-works" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Steve Safari" className="h-10 w-10 object-contain" />
          <span className="font-heading font-bold text-lg text-foreground">
            Steve <span className="text-safari-gold">Safari</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.label} to={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
          {user ? (
            <Button size="sm" onClick={() => navigate("/dashboard")}>Dashboard</Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")}>Get Started</Button>
          )}
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
            {user ? (
              <Button size="sm" className="w-full mt-2" onClick={() => { navigate("/dashboard"); setOpen(false); }}>Dashboard</Button>
            ) : (
              <Button size="sm" className="w-full mt-2" onClick={() => { navigate("/auth"); setOpen(false); }}>Get Started</Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
