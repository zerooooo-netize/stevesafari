import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Currency = "KES" | "CAD";

// Approximate static rate (1 CAD ≈ 95 KES). Can later be made dynamic via settings.
const KES_PER_CAD = 95;

interface CurrencyCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggle: () => void;
  /** Convert a value from its source currency into the active display currency. */
  convert: (amount: number, from?: Currency) => number;
  /** Format a value (with optional source currency) into a localized display string. */
  format: (amount: number, from?: Currency) => string;
  /** Re-render numeric tokens inside a free-text salary/price string in active currency. */
  formatSalary: (input?: string | null) => string;
  rate: number;
}

const Ctx = createContext<CurrencyCtx | null>(null);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === "undefined") return "KES";
    return (localStorage.getItem("currency") as Currency) || "KES";
  });

  useEffect(() => {
    try { localStorage.setItem("currency", currency); } catch { /* ignore */ }
  }, [currency]);

  const setCurrency = (c: Currency) => setCurrencyState(c);
  const toggle = () => setCurrencyState((c) => (c === "KES" ? "CAD" : "KES"));

  const convert = (amount: number, from: Currency = "KES") => {
    if (!amount || isNaN(amount)) return 0;
    if (from === currency) return amount;
    if (from === "KES" && currency === "CAD") return amount / KES_PER_CAD;
    if (from === "CAD" && currency === "KES") return amount * KES_PER_CAD;
    return amount;
  };

  const format = (amount: number, from: Currency = "KES") => {
    const value = convert(amount, from);
    if (currency === "CAD") {
      return `CAD ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `KES ${Math.round(value).toLocaleString()}`;
  };

  /** Parse a free-text salary string (e.g. "CAD 3,200/mo", "$30/hr", "KES 50,000")
   *  and re-render every numeric token in the active currency. */
  const formatSalary = (input?: string | null): string => {
    if (!input) return "";
    const str = String(input);
    // Detect source currency from string
    const upper = str.toUpperCase();
    let from: Currency = "KES";
    if (/\bCAD\b|C\$|\$|\bUSD\b/.test(upper)) from = "CAD";
    else if (/\bKES\b|KSH|KSHS/.test(upper)) from = "KES";

    // Replace numeric tokens (with optional commas/decimals) inline
    const replaced = str.replace(/[\d,]+(?:\.\d+)?/g, (m) => {
      const n = parseFloat(m.replace(/,/g, ""));
      if (!isFinite(n)) return m;
      const v = convert(n, from);
      return currency === "CAD"
        ? v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
        : Math.round(v).toLocaleString();
    });
    // Strip old currency tokens, then prefix with active currency
    const cleaned = replaced
      .replace(/\b(CAD|USD|KES|KSH|KSHS)\b/gi, "")
      .replace(/C\$|\$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return `${currency} ${cleaned}`;
  };

  return (
    <Ctx.Provider value={{ currency, setCurrency, toggle, convert, format, formatSalary, rate: KES_PER_CAD }}>
      {children}
    </Ctx.Provider>
  );
};

export const useCurrency = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCurrency must be used inside CurrencyProvider");
  return v;
};
