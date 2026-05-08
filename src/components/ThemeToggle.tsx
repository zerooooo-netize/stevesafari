import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const opts: { value: ThemeMode; icon: any; label: string }[] = [
  { value: "system", icon: Monitor, label: "System" },
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
];

const ThemeToggle = ({ className }: { className?: string }) => {
  const { mode, setMode } = useTheme();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card/80 backdrop-blur-sm p-0.5 shadow-sm",
        className
      )}
      role="group"
      aria-label="Theme selector"
    >
      {opts.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setMode(value)}
          aria-pressed={mode === value}
          aria-label={label}
          title={label}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-full transition-all",
            mode === value
              ? "bg-safari-gold text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
