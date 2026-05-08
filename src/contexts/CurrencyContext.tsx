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

  return (
    <Ctx.Provider value={{ currency, setCurrency, toggle, convert, format, rate: KES_PER_CAD }}>
      {children}
    </Ctx.Provider>
  );
};

export const useCurrency = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCurrency must be used inside CurrencyProvider");
  return v;
};
