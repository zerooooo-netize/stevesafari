import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import CurrencyToggle from "@/components/CurrencyToggle";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
 { label: "Home", href: "/" },
 { label: "Jobs", href: "/jobs" },
 { label: "Services", href: "/services" },
 { label: "How It Works", href: "/how-it-works" },
 { label: "Trust", href: "/trust" },
];

const Navbar = () =>{
 const [open, setOpen] = useState(false);
 const { user } = useAuth();
 const navigate = useNavigate();
 const { name, logoUrl } = useBranding();

 const ctaClick = () =>{
 navigate(user ? "/dashboard" : "/auth?redirect=/welcome");
 setOpen(false);
 };

 // Split brand name so the last word is gold-accented (e.g. "Steve Safari" → "Steve" + "Safari")
 const parts = name.trim().split(" ");
 const lead = parts.length >1 ? parts.slice(0, -1).join(" ") : name;
 const accent = parts.length >1 ? parts[parts.length - 1] : "";

 return (
<nav className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
<div className="container flex items-center justify-between h-[clamp(4.5rem,8vw,7.5rem)]">
<Link to="/" className="flex items-center gap-2.5 sm:gap-3 md:gap-4 min-w-0">
<img src={logoUrl} alt={name} className="object-contain shrink-0" style={{ height: 'clamp(3rem, 6vw, 5.5rem)', width: 'clamp(3rem, 6vw, 5.5rem)' }} />
<span className="font-heading font-extrabold tracking-tight text-foreground leading-none truncate" style={{ fontSize: 'clamp(1.25rem, 2.2vw, 2.25rem)' }}>
  {lead}{accent &&<><span className="text-safari-gold">{accent}</span></>}
</span>
</Link>

<div className="hidden md:flex items-center gap-6">
 {navLinks.map((link) =>(
<Link key={link.label} to={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
 {link.label}
</Link>
          ))}
<CurrencyToggle />
<ThemeToggle />
<Button size="sm" onClick={ctaClick}>{user ? "Dashboard" : "Get Started"}</Button>
</div>

        <div className="md:hidden flex items-center gap-1.5">
<ThemeToggle />
<CurrencyToggle />
<button className="p-2 text-foreground" onClick={() => setOpen(!open)} aria-label="Toggle menu">
  {open ? <X size={24} /> : <Menu size={24} />}
</button>
</div>
</div>

 {open && (
<div className="md:hidden bg-card border-b border-border pb-4">
<div className="container flex flex-col gap-3">
 {navLinks.map((link) =>(
<Link key={link.label} to={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground py-2" onClick={() =>setOpen(false)}>
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
