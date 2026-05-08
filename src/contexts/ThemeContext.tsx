import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeCtx {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (m: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

const getSystem = (): "light" | "dark" =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme") as ThemeMode) || "system";
  });
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    typeof window === "undefined" ? "light" : (localStorage.getItem("theme") as ThemeMode) === "dark" ? "dark" : (localStorage.getItem("theme") as ThemeMode) === "light" ? "light" : getSystem()
  );

  useEffect(() => {
    const apply = () => {
      const next = mode === "system" ? getSystem() : mode;
      setResolved(next);
      const root = document.documentElement;
      root.classList.toggle("dark", next === "dark");
    };
    apply();
    try { localStorage.setItem("theme", mode); } catch {}
    if (mode === "system" && typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply();
      mq.addEventListener?.("change", handler);
      return () => mq.removeEventListener?.("change", handler);
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => setModeState(m);

  return <Ctx.Provider value={{ mode, resolved, setMode }}>{children}</Ctx.Provider>;
};

export const useTheme = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
};
