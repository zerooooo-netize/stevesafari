// NotFound.tsx
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, Briefcase, FileText, ArrowLeft, Compass } from "lucide-react";
import logo from "@/assets/logo.png";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () =>{
 const location = useLocation();

 useEffect(() =>{
 console.error("404 Error: User attempted to access non-existent route:", location.pathname);
 }, [location.pathname]);

 return (
<div className="min-h-screen bg-background flex flex-col">
<Navbar />
<main className="flex-1 flex items-center justify-center page-x section-y">
<div className="max-w-2xl w-full text-center">
 {/* Logo */}
<Link to="/" className="inline-block mb-8">
<img src={logo} alt="Steve Safari" className="h-16 w-16 mx-auto" />
</Link>

 {/* 404 Illustration / Message */}
<div className="mb-6">
<h1 className="font-heading text-display text-safari-gold mb-2">404</h1>
<div className="flex items-center justify-center gap-2 text-muted-foreground">
<span className="w-12 h-px bg-border"></span>
<span className="text-sm uppercase tracking-wider">Page Not Found</span>
<span className="w-12 h-px bg-border"></span>
</div>
</div>

<p className="text-h3 font-heading font-medium text-foreground mb-3">
 Oops! Looks like you've wandered off the safari trail.
</p>
<p className="text-muted-foreground mb-8 max-w-md mx-auto">
 The page<code className="bg-muted px-2 py-0.5 rounded text-sm">{location.pathname}</code>doesn't exist. 
 Maybe the job you were looking for has been filled or the link is broken.
</p>

 {/* Quick Action Buttons */}
<div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
<Button asChild size="lg" className="gap-2">
<Link to="/">
<Home size={18} />Return Home
</Link>
</Button>
<Button asChild variant="outline" size="lg" className="gap-2">
<Link to="/jobs">
<Briefcase size={18} />Browse Jobs
</Link>
</Button>
<Button asChild variant="outline" size="lg" className="gap-2">
<Link to="/services">
<FileText size={18} />Our Services
</Link>
</Button>
</div>

 {/* Search Suggestion (optional) */}
<div className="bg-muted/30 rounded-xl p-5 max-w-md mx-auto border border-border">
<p className="text-sm font-medium mb-3 flex items-center justify-center gap-2">
<Search size={16} className="text-safari-gold" />
 Looking for something specific?
</p>
<div className="relative">
<input
 type="text"
 placeholder="Search jobs, services..."
 className="w-full px-4 py-2 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-safari-gold/20"
 onKeyDown={(e) =>{
 if (e.key === "Enter") {
 const query = (e.target as HTMLInputElement).value;
 if (query) window.location.href = `/jobs?search=${encodeURIComponent(query)}`;
 }
 }}
 />
<Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
</div>
</div>

 {/* Helpful Links */}
<div className="mt-8 text-sm text-muted-foreground">
<p className="mb-2">Or try one of these helpful links:</p>
<div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
<Link to="/about" className="hover:text-safari-gold transition-colors">About Us</Link>
<Link to="/contact" className="hover:text-safari-gold transition-colors">Contact Support</Link>
<Link to="/faq" className="hover:text-safari-gold transition-colors">FAQs</Link>
<Link to="/trust" className="hover:text-safari-gold transition-colors">Trust & Safety</Link>
</div>
</div>

 {/* Back Button */}
<button
 onClick={() =>window.history.back()}
 className="mt-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
 >
<ArrowLeft size={14} />Go back to previous page
</button>
</div>
</main>
<Footer />
</div>
 );
};

export default NotFound;
