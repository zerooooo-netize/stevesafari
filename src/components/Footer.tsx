import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Globe } from "lucide-react";
import logo from "@/assets/logo.png";
import { useSettings } from "@/hooks/useSettings";

const KEYS = [
  "whatsapp_number", "footer_tagline", "footer_address", "footer_email",
  "social_facebook", "social_instagram", "social_twitter", "social_linkedin",
  "site_name",
];

const Footer = () => {
  const { str } = useSettings(KEYS);
  const whatsapp = str("whatsapp_number", "");
  const phoneDigits = whatsapp.replace(/[^\d]/g, "");
  const email = str("footer_email", "dereknash@usa.com");
  const socials = [
    { url: str("social_facebook", ""), label: "Facebook" },
    { url: str("social_instagram", ""), label: "Instagram" },
    { url: str("social_twitter", ""), label: "Twitter" },
    { url: str("social_linkedin", ""), label: "LinkedIn" },
  ].filter(s => s.url);

  return (
    <footer className="bg-primary text-primary-foreground section-y page-x">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Steve Safari" className="h-8 w-8 object-contain" />
              <span className="font-heading font-bold text-lg">
                Steve<span className="text-safari-gold">Safari</span>
              </span>
            </div>
            <p className="text-sm text-primary-foreground/70">
              {str("footer_tagline", "Your trusted partner for international recruitment and document services.")}
            </p>
            {socials.length > 0 && (
              <div className="flex gap-3 mt-4">
                {socials.map(({ url, label }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-9 h-9 rounded-full bg-primary-foreground/10 hover:bg-safari-gold hover:text-primary flex items-center justify-center transition-colors">
                    <Globe size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <Link to="/" className="hover:text-safari-gold transition-colors">Home</Link>
              <Link to="/jobs" className="hover:text-safari-gold transition-colors">Jobs</Link>
              <Link to="/services" className="hover:text-safari-gold transition-colors">Services</Link>
              <Link to="/how-it-works" className="hover:text-safari-gold transition-colors">How It Works</Link>
              <Link to="/trust" className="hover:text-safari-gold transition-colors">Trust & Safety</Link>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Services</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <Link to="/services" className="hover:text-safari-gold transition-colors">CV Rewrite</Link>
              <Link to="/services" className="hover:text-safari-gold transition-colors">Cover Letter</Link>
              <Link to="/services" className="hover:text-safari-gold transition-colors">Passport Processing</Link>
              <Link to="/services" className="hover:text-safari-gold transition-colors">Visa Assistance</Link>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Contact Us</h4>
            <div className="flex flex-col gap-3 text-sm text-primary-foreground/70">
              {whatsapp && (
                <a href={`tel:+${phoneDigits}`} className="flex items-center gap-2 hover:text-safari-gold transition-colors">
                  <Phone size={14} className="text-safari-gold" /><span>{whatsapp}</span>
                </a>
              )}
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-safari-gold transition-colors break-all">
                <Mail size={14} className="text-safari-gold shrink-0" /><span>{email}</span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-safari-gold" />
                <span>{str("footer_address", "Nairobi, Kenya")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} {str("site_name", "Steve Safari Agency")}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
