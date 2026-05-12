import { motion } from "framer-motion";
import { FileText, Stamp, Globe, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";

const services = [
 {
 icon: FileText,
 title: "CV Rewrite",
 description: "Professional CV tailored for international job markets and employer expectations.",
 price: "KES 2,500",
 },
 {
 icon: FileCheck,
 title: "Cover Letter",
 description: "Compelling cover letters customized for each job application.",
 price: "KES 1,500",
 },
 {
 icon: Stamp,
 title: "Passport Processing",
 description: "Fast-track passport application assistance and guidance.",
 price: "KES 5,000",
 },
 {
 icon: Globe,
 title: "Visa Assistance",
 description: "End-to-end visa application support for your destination country.",
 price: "KES 10,000",
 },
];

const ServicesSection = () =>{
 return (
<section className="py-20 bg-muted">
<div className="container">
<motion.div
 className="text-center mb-12"
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 >
<span className="text-sm font-medium text-safari-gold uppercase tracking-wider">Services</span>
<h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2">
 Document Services
</h2>
<p className="text-muted-foreground mt-3 max-w-md mx-auto">
 Get professional help with all your travel and work documents.
</p>
</motion.div>

<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {services.map((service, i) =>(
<motion.div
 key={service.title}
 className="bg-card rounded-lg border border-border p-6 text-center shadow-card hover:shadow-elevated transition-all hover:-translate-y-1"
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.4, delay: i * 0.1 }}
 >
<div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-safari-gold/10 text-safari-gold mb-4">
<service.icon size={24} />
</div>
<h3 className="font-heading font-semibold text-foreground">{service.title}</h3>
<p className="text-sm text-muted-foreground mt-2 mb-4">{service.description}</p>
<div className="font-heading font-bold text-safari-gold text-lg">{service.price}</div>
<Button variant="outline" size="sm" className="mt-4 w-full">
 Order Now<ArrowRight size={14} />
</Button>
</motion.div>
 ))}
</div>
</div>
</section>
 );
};

export default ServicesSection;
