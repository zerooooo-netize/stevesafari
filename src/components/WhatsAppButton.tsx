import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WhatsAppButton = () => {
  const [number, setNumber] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("settings")
      .select("value")
      .eq("key", "whatsapp_number")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setNumber(data.value.replace(/[^\d]/g, ""));
      });
  }, []);

  if (!number) return null;

  const message = encodeURIComponent("Hello Steve Safari, I would like to know more about working abroad.");
  const href = `https://wa.me/${number}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 left-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-elevated hover:scale-110 transition-transform"
    >
      <MessageCircle size={28} />
    </a>
  );
};

export default WhatsAppButton;
