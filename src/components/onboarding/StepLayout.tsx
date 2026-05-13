import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check } from "lucide-react";

interface Props {
 stepNumber: number;
 totalSteps: number;
 title: string;
 subtitle?: string;
 children: ReactNode;
}

const StepLayout = ({ stepNumber, totalSteps, title, subtitle, children }: Props) =>{
 const pct = Math.round((stepNumber / totalSteps) * 100);
 return (
<div className="min-h-screen flex flex-col bg-background">
<Navbar />
<main className="flex-1 pt-24 sm:pt-28 section-y-sm">
<div className="max-w-2xl mx-auto page-x">
 {/* Progress */}
<div className="mb-6">
<div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
<span>Step {stepNumber} of {totalSteps}</span>
<span>{pct}% complete</span>
</div>
<div className="h-2 bg-muted rounded-full overflow-hidden">
<div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
</div>
</div>

<div className="bg-card border border-border rounded-2xl surface-pad-lg shadow-card">
<h1 className="font-heading text-h2 mb-2">{title}</h1>
 {subtitle &&<p className="text-muted-foreground mb-6">{subtitle}</p>}
 {children}
</div>
</div>
</main>
<Footer />
</div>
 );
};

export default StepLayout;
export const StepDoneIcon = () =><Check size={16} className="text-green-600" />;
