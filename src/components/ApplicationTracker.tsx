import { Check, Clock, Lock } from "lucide-react";

const STAGES = [
 { key: "registered", label: "Registered" },
 { key: "deposit_paid", label: "Deposit Paid" },
 { key: "paid", label: "Paid in Full" },
 { key: "documents_submitted", label: "Documents Submitted" },
 { key: "verified", label: "Verified" },
 { key: "batch_assigned", label: "Travel Batch Assigned" },
 { key: "completed", label: "Completed" },
];

const STATUS_INDEX: Record<string, number>= {
 registered: 0,
 deposit_paid: 1,
 paid: 2,
 documents_submitted: 3,
 verified: 4,
 batch_assigned: 5,
 completed: 6,
};

interface Props {
 status: string;
}

const ApplicationTracker = ({ status }: Props) =>{
 const current = STATUS_INDEX[status] ?? 0;
 const isRejected = status === "rejected";

 return (
<div className="space-y-2">
<div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
<span>Application Progress</span>
<span className="font-medium text-foreground">
 {isRejected ? "Rejected" : `Step ${current + 1} of ${STAGES.length}`}
</span>
</div>
<ol className="space-y-2">
 {STAGES.map((stage, i) =>{
 const done = !isRejected && i< current;
 const active = !isRejected && i === current;
 const locked = !isRejected && i >current;
 return (
<li key={stage.key} className="flex items-center gap-3 text-xs">
<span
 className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
 done
 ? "bg-green-600 text-white"
 : active
 ? "bg-safari-gold text-foreground animate-pulse"
 : "bg-muted text-muted-foreground"
 }`}
 >
 {done ?<Check size={12} />: active ?<Clock size={12} />:<Lock size={10} />}
</span>
<span
 className={
 done
 ? "text-foreground line-through opacity-70"
 : active
 ? "text-foreground font-semibold"
 : "text-muted-foreground"
 }
 >
 {stage.label}
</span>
 {active && (
<span className="ml-auto text-[10px] bg-safari-gold/20 text-safari-gold px-2 py-0.5 rounded-full">
 In progress
</span>
 )}
 {locked && (
<span className="ml-auto text-[10px] text-muted-foreground">Locked</span>
 )}
</li>
 );
 })}
</ol>
</div>
 );
};

export default ApplicationTracker;
