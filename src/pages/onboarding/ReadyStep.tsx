import { useNavigate } from "react-router-dom";
import StepLayout from "@/components/onboarding/StepLayout";
import { Button } from "@/components/ui/button";
import { PartyPopper, Plane, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ReadyStep = () =>{
 const navigate = useNavigate();
 const { profile } = useAuth();
 const isJobs = profile?.chosen_path === "jobs";

 return (
 <StepLayout
 stepNumber={isJobs ? 7 : 4}
 totalSteps={isJobs ? 7 : 4}
 title={isJobs ? " You' re ready to fly!": "You' re all set!"}
 subtitle={isJobs ? " Congratulations! All steps complete. Wait for your final travel itinerary by email.": "Your services are being processed. You' ll receive completed documents in your dashboard."}
 ><div className="space-y-5 text-center"><div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">{isJobs ? <Plane size={48} className="text-primary"/>: <PartyPopper size={48} className="text-primary"/>}
 </div><div className="bg-muted/40 rounded-xl p-4 text-sm text-left space-y-2"><h4 className="font-semibold">What happens next?</h4><ul className="space-y-1 text-muted-foreground">{isJobs ? (
 <><li>️ Final travel briefing by email/SMS</li><li>Pre-departure checklist sent 7 days before flight</li><li>Accommodation confirmation upon arrival</li></>) : (
 <><li>Document processing typically takes 3–7 days</li><li>Email notification when ready</li><li>️ Download from your dashboard once complete</li></>)}
 </ul></div><Button onClick={() => navigate("/dashboard")} className="w-full">Go to Dashboard <ChevronRight size={16} className="ml-1"/></Button></div></StepLayout>);
};

export default ReadyStep;
