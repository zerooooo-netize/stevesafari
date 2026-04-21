import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/logo.png";

/**
 * Loads dynamic site branding (name, logo, tagline) from settings table.
 * Falls back to bundled defaults so the UI is never empty.
 */
export const useBranding = () => {
  const [name, setName] = useState("Steve Safari Agency");
  const [logoUrl, setLogoUrl] = useState<string>(defaultLogo);
  const [tagline, setTagline] = useState("Your Gateway to Working in Canada");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("key,value")
        .in("key", ["site_name", "site_logo_url", "site_tagline"]);
      if (cancelled) return;
      const map = Object.fromEntries((data || []).map((s: any) => [s.key, s.value]));
      if (map.site_name) setName(map.site_name);
      if (map.site_logo_url && map.site_logo_url.trim()) setLogoUrl(map.site_logo_url);
      if (map.site_tagline) setTagline(map.site_tagline);
    })();
    return () => { cancelled = true; };
  }, []);

  return { name, logoUrl, tagline, defaultLogo };
};
