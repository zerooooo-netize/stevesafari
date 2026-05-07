import { motion } from "framer-motion";
import { UserPlus, Search, CreditCard, FileCheck, Plane } from "lucide-react";

const steps = [
 {
 icon: UserPlus,
 title: "Register",
 description: "Create your account in minutes. It's free to browse.",
 },
 {
 icon: Search,
 title: "Choose a Job",
 description: "Browse available jobs and select one that fits your skills.",
 },
 {
 icon: CreditCard,
 title: "Pay & Apply",
 description: "Pay the application fee (deposits accepted) and submit your documents.",
 },
 {
 icon: FileCheck,
 title: "Get Verified",
 description: "Our team reviews your documents and prepares your application.",
 },
 {
 icon: Plane,
 title: "Travel",
 description: "Get assigned to a travel batch and prepare for departure.",
 },
];

const HowItWorks = () =>{
 return (
<section id="how-it-works" className="section-y-lg bg-background">
<div className="container page-x">
<motion.div
 className="text-center mb-14 max-w-2xl mx-auto"
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 >
<span className="inline-block text-xs sm:text-sm font-semibold text-safari-gold uppercase tracking-[0.2em] bg-safari-gold/10 px-4 py-1.5 rounded-full">Process</span>
<h2 className="font-heading text-h1 font-bold text-foreground mt-4">
 How It Works
</h2>
<p className="text-muted-foreground mt-4 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
 From registration to departure, we guide you every step of the way.
</p>
</motion.div>

<div className="relative">
 {/* Connection line */}
<div className="hidden lg:block absolute top-16 left-[10%] right-[10%] h-0.5 bg-border" />

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
 {steps.map((step, i) =>(
<motion.div
 key={step.title}
 className="flex flex-col items-center text-center relative"
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.4, delay: i * 0.1 }}
 >
<div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-card mb-4">
<step.icon size={24} />
</div>
<div className="absolute top-5 -left-2 z-20 w-6 h-6 rounded-full bg-safari-gold text-foreground flex items-center justify-center text-xs font-bold font-heading">
 {i + 1}
</div>
<h3 className="font-heading font-semibold text-foreground">{step.title}</h3>
<p className="text-sm text-muted-foreground mt-1 max-w-[180px]">{step.description}</p>
</motion.div>
 ))}
</div>
</div>
</div>
</section>
 );
};

export default HowItWorks;
