import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const CTASection = () =>{
 const { user } = useAuth();
 const navigate = useNavigate();

 return (
<section className="section-y-lg relative overflow-hidden">
<div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
<div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-safari-gold/20 blur-3xl" />
<div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-safari-cream/10 blur-3xl" />
<div className="container page-x relative z-10">
<motion.div
 className="text-center max-w-2xl mx-auto"
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 >
<h2 className="font-heading text-h1 font-bold text-safari-cream leading-tight">
 Ready to Start Your<span className="text-safari-gold"> Journey?</span>
</h2>
<p className="text-safari-cream/85 mt-5 text-base sm:text-lg leading-relaxed">
 Join hundreds of Kenyans who have successfully landed international jobs through Steve Safari. You are one step away.
</p>
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-9">
<Button variant="hero" size="lg" className="text-base" onClick={() =>navigate(user ? "/welcome" : "/auth?redirect=/welcome")}>
 Get Started Now<ArrowRight size={18} />
</Button>
<Button variant="hero-outline" size="lg" className="text-base" asChild>
<Link to="/trust"><MessageCircle size={18} />Why Trust Us</Link>
</Button>
</div>
</motion.div>
</div>
</section>
 );
};

export default CTASection;
