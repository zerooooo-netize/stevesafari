import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/dbRetry";

/**
 * Loads public (non-secret) settings from DB.
 * Returns a typed map of setting key → string value, plus loading flag.
 *
 * Common keys used across the app:
 *  - registration_fee
 *  - service_half_payment_enabled
 *  - payment_gate_enabled
 *  - path_gate_enabled
 *  - max_active_applications
 *  - referral_signup_discount
 */
export const useSettings = (keys?: string[]) => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await withRetry(async () => {
          let q = supabase.from("settings").select("key,value").eq("is_secret", false);
          if (keys && keys.length) q = q.in("key", keys);
          return await q;
        });
        if (cancelled) return;
        if (error) throw error;
        const map: Record<string, string> = {};
        (data || []).forEach((s: any) => { map[s.key] = s.value; });
        setSettings(map);
        setError(null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(keys || [])]);

  return {
    settings,
    loading,
    error,
    /** Numeric helper with fallback */
    num: (key: string, fallback = 0) => {
      const v = parseFloat(settings[key]);
      return isNaN(v) ? fallback : v;
    },
    /** Boolean helper (string "true"/"false") with fallback */
    bool: (key: string, fallback = false) => {
      const v = settings[key];
      if (v === undefined) return fallback;
      return v === "true" || v === "1";
    },
    str: (key: string, fallback = "") => settings[key] ?? fallback,
  };
};
