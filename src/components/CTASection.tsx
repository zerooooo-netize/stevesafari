import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const CTASection = () =>{
 const { user } = useAuth();
 const navigate = useNavigate();

 return (
<section className="py-20 relative overflow-hidden">
<div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
<div className="container relative z-10">
<motion.div
 className="text-center max-w-2xl mx-auto"
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 >
<h2 className="font-heading text-3xl md:text-4xl font-bold text-safari-cream">
 Ready to Start Your Journey?
</h2>
<p className="text-safari-cream/80 mt-4 text-lg">
 Join hundreds of Kenyans who have successfully landed international jobs through Steve Safari. One step away.
</p>
<div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
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
