import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-14">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Steve Safari" className="h-8 w-8 object-contain" />
              <span className="font-heading font-bold text-lg">
                Steve <span className="text-safari-gold">Safari</span>
              </span>
            </div>
            <p className="text-sm text-primary-foreground/70">
              Your trusted partner for international recruitment and document services.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <Link to="/" className="hover:text-safari-gold transition-colors">Home</Link>
              <Link to="/jobs" className="hover:text-safari-gold transition-colors">Jobs</Link>
              <Link to="/services" className="hover:text-safari-gold transition-colors">Services</Link>
              <Link to="/contact" className="hover:text-safari-gold transition-colors">Contact</Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Services</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <span>CV Rewrite</span>
              <span>Cover Letter</span>
              <span>Passport Processing</span>
              <span>Visa Assistance</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Contact Us</h4>
            <div className="flex flex-col gap-3 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-safari-gold" />
                <span>+254 700 000 000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-safari-gold" />
                <span>info@stevesafari.co.ke</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-safari-gold" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} Steve Safari Agency. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
