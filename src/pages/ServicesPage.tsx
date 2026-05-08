// ServicesPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { FileText, Stamp, Globe, FileCheck, ArrowRight, X, Shield, Loader2, CheckCircle2, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, any>= { "file-text": FileText, "file-check": FileCheck, "stamp": Stamp, "globe": Globe };

// M-Pesa Payment Widget for services
const MpesaPaymentWidget = ({ userId, serviceId, amount, onPaymentComplete }: { userId: string; serviceId: string; amount: number; onPaymentComplete: (receiptNumber?: string) =>void }) =>{
 const [phone, setPhone] = useState("+254");
 const [sending, setSending] = useState(false);
 const [pollId, setPollId] = useState<string | null>(null);
 const [payStatus, setPayStatus] = useState<string | null>(null);

 const STK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mpesa-stk-push`;

 const initiate = async () =>{
 if (!phone || phone.length< 12) { toast.error("Enter a valid phone number (+254...)"); return; }
 setSending(true);
 setPayStatus("sending");
 try {
 const resp = await fetch(STK_URL, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
 },
 body: JSON.stringify({
 phone,
 amount,
 userId,
 paymentType: "service_payment",
 serviceId: serviceId,
 description: "Service order payment",
 }),
 });
 const data = await resp.json();
 if (!resp.ok) throw new Error(data.error || " Payment failed");

 toast.success(data.message || " Check your phone for M-Pesa prompt! ");
 setPollId(data.paymentId);
 setPayStatus("waiting");

 let attempts = 0;
 const interval = setInterval(async () =>{
 attempts++;
 if (attempts >30) { clearInterval(interval); setPayStatus("timeout"); setSending(false); return; }
 try {
 const statusResp = await fetch(`${STK_URL}? action=status&payment_id=${data.paymentId}`, {
 headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`},
 });
 const statusData = await statusResp.json();
 if (statusData.status === "completed") {
 clearInterval(interval);
 setPayStatus("completed");
 setSending(false);
 toast.success(`Payment received! Receipt ${statusData.receipt_number || ""}`);
 onPaymentComplete(statusData.receipt_number);
 } else if (statusData.status === "failed") {
 clearInterval(interval);
 setPayStatus("failed");
 setSending(false);
 toast.error("Payment failed. Please try again.");
 }
 } catch { /* keep polling */ }
 }, 5000);
 } catch (e: any) {
 toast.error(e.message);
 setPayStatus(null);
 setSending(false);
 }
 };

 if (payStatus === "waiting") {
 return (
<div className="text-center py-6"><Loader2 size={32} className="animate-spin mx-auto text-safari-gold mb-3"/><p className="font-medium text-sm">Check your phone!</p><p className="text-xs text-muted-foreground mt-1">Enter your M-Pesa PIN when prompted.</p></div>);
 }

 if (payStatus === "completed") {
 return (
<div className="text-center py-6"><CheckCircle2 size={32} className="mx-auto text-green-600 mb-3"/><p className="font-medium text-sm text-green-700">Payment Successful!</p><p className="text-xs text-muted-foreground mt-1">Your order has been placed.</p></div>);
 }

 return (
<div className="space-y-3"><div><Label className="text-xs">Phone Number *</Label><Input value={phone} onChange={e =>setPhone(e.target.value)} placeholder="+254712345678" className="text-sm"/></div><div className="text-[11px] text-muted-foreground bg-muted/30 rounded p-2 flex items-start gap-1.5"><Shield size={12} className="text-safari-gold mt-0.5 shrink-0"/><span>Securely processed via M-Pesa (Kopo Kopo). Official receipt provided.</span></div><Button onClick={initiate} disabled={sending} className="w-full">{sending ?<><Loader2 size={14} className="animate-spin mr-1"/>Processing...</>: `Pay KES ${amount.toLocaleString()} with M-Pesa`}
</Button>{payStatus === "failed"&&<p className="text-xs text-destructive text-center">Payment failed. Try again.</p>}
 {payStatus === "timeout"&&<p className="text-xs text-yellow-600 text-center">Payment not confirmed. Check history.</p>}
</div>);
};

const ServicesPage = () =>{
 const [services, setServices] = useState<any[]>([]);
 const [selectedService, setSelectedService] = useState<any | null>(null);
 const [details, setDetails] = useState("");
 const [file, setFile] = useState<File | null>(null);
 const [loading, setLoading] = useState(true);
 const [orderStep, setOrderStep] = useState<"details"| "payment">("details");
 const { user } = useAuth();
 const { format } = useCurrency();
 const navigate = useNavigate();

 useEffect(() =>{ load(); }, []);
 const load = async () =>{
 const { data } = await supabase.from("services").select("*").eq("is_active", true).order("created_at");
 setServices(data || []);
 setLoading(false);
 };

 const handleOrderClick = (service: any) =>{
 if (!user) {
 navigate(`/auth? redirect=/services/${service.id}`);
 return;
 }
 // Single source of truth - always order via the detail page (full/half payment + checkout)
 navigate(`/services/${service.id}`);
 };

 const handlePaymentComplete = async (receiptNumber?: string) =>{
 if (!user || !selectedService) return;

 // Upload file first (if any)
 let uploadedUrl: string | null = null;
 if (file) {
 const path = `${user.id}/${Date.now()} _${file.name}`;
 const { error: upErr } = await supabase.storage.from("service-files").upload(path, file);
 if (upErr) {
 toast.error("File upload failed: "+ upErr.message);
 return;
 }
 const { data: urlData } = supabase.storage.from("service-files").getPublicUrl(path);
 uploadedUrl = urlData.publicUrl;
 }

 // Create service order (status will be 'paid' or 'pending_payment' based on backend)
 const { error } = await supabase.from("service_orders").insert({
 user_id: user.id,
 service_id: selectedService.id,
 details,
 uploaded_file_url: uploadedUrl,
 status: "paid", // or whatever your workflow expects
 });

 if (error) {
 toast.error("Order creation failed: "+ error.message);
 return;
 }

 toast.success("Order placed successfully! Check your dashboard for updates.");
 setSelectedService(null);
 navigate("/dashboard");
 };

 return (
<div className="min-h-screen bg-background"><Navbar /><main className="pt-20 section-y-sm page-x"><div className="max-w-6xl mx-auto"><div className="text-center mb-8 sm:mb-12"><h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Document Services</h1><p className="text-muted-foreground mt-2 text-sm sm:text-base">Professional document preparation. Pay securely via M-Pesa.
</p></div>{loading ? (
<div className="text-center section-y-sm text-muted-foreground">Loading...</div>) : services.length === 0 ? (
<div className="text-center section-y-sm text-muted-foreground">No services available right now.</div>) : (
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">{services.map((service, i) => {
  const Icon = iconMap[service.icon] || FileText;
  return (
    <motion.div
      key={service.id}
      className="group relative bg-card rounded-2xl border border-border/70 overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: i * 0.08 }}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-safari-gold/10 blur-2xl group-hover:bg-safari-gold/20 transition-colors" />
      <div className="relative p-5 flex flex-col flex-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-safari-gold/30 to-safari-gold/10 text-safari-gold mb-4 shadow-sm">
          <Icon size={22} />
        </div>
        <h3 className="font-heading font-bold text-foreground text-base leading-tight">{service.name}</h3>
        <p className="text-caption text-muted-foreground mt-2 line-clamp-3 flex-1">{service.description}</p>

        <div className="mt-4 rounded-xl bg-gradient-to-r from-safari-gold/15 to-safari-gold/5 px-3 py-2.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Price</span>
          <span className="font-heading font-bold text-safari-gold text-sm sm:text-base">{format(Number(service.price), service.currency || "KES")}</span>
        </div>

        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="flex-1 h-10 text-button" asChild>
            <Link to={`/services/${service.id}`}>Details</Link>
          </Button>
          <Button size="sm" className="flex-1 h-10 text-button" onClick={() => handleOrderClick(service)}>
            Order<ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
})}
</div>)}

 {/* Order Modal */}
 {selectedService && (
<div className="fixed inset-0 bg-foreground/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"><div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border p-5 sm:p-6 w-full sm:max-w-md shadow-elevated max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-start mb-3"><h3 className="font-heading font-semibold text-lg">Order: {selectedService.name}</h3><button onClick={() =>setSelectedService(null)} className="p-1 hover:bg-muted rounded"><X size={20} /></button></div><p className="text-sm text-muted-foreground mb-4">Price:<span className="font-semibold text-safari-gold">{selectedService.currency} {Number(selectedService.price).toLocaleString()}</span></p>{orderStep === "details"? (
<><Label className="text-xs">What do you need? (Details)</Label><Textarea
 value={details}
 onChange={e =>setDetails(e.target.value)}
 rows={3}
 placeholder=" e.g. Update my CV for warehouse jobs in Toronto" className="mb-3 text-sm"/><Label className="text-xs">Attach file (optional, max 10MB)</Label><input
 type="file" onChange={e =>setFile(e.target.files?.[0] || null)}
 accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="block w-full text-sm mb-4 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-safari-gold/10 file:text-safari-gold file:font-medium"/><p className="text-xs text-muted-foreground mb-3">After payment, your order will be processed by our team.
</p><div className="flex gap-2"><Button
 onClick={() =>setOrderStep("payment")}
 className="flex-1 h-11">Proceed to Payment<ArrowRight size={14} className="ml-1"/></Button><Button variant="outline" onClick={() =>setSelectedService(null)} className="h-11">Cancel
</Button></div></>) : (
<><div className="mb-4 p-3 bg-muted/30 rounded-lg"><p className="text-xs font-medium">Order Summary</p><p className="text-xs text-muted-foreground mt-1">{details || " No details provided"}
</p>{file &&<p className="text-xs text-muted-foreground mt-1">{file.name}</p>}
</div><MpesaPaymentWidget
 userId={user!.id}
 serviceId={selectedService.id}
 amount={Number(selectedService.price)}
 onPaymentComplete={handlePaymentComplete}
 /><button
 onClick={() =>setOrderStep("details")}
 className="text-xs text-muted-foreground hover:underline mt-3 w-full text-center">← Back to edit details
</button></>)}
</div></div>)}
</div></main><Footer /></div>);
};

export default ServicesPage;
