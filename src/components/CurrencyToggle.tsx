import { useCurrency, Currency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

/** Compact pill toggle to switch the displayed currency between KES and CAD. */
const CurrencyToggle = ({ className }: { className?: string }) => {
  const { currency, setCurrency } = useCurrency();
  const opts: Currency[] = ["KES", "CAD"];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card/80 backdrop-blur-sm p-0.5 shadow-sm",
        className
      )}
      role="group"
      aria-label="Currency selector"
    >
      {opts.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCurrency(c)}
          aria-pressed={currency === c}
          className={cn(
            "px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all",
            currency === c
              ? "bg-safari-gold text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
};

export default CurrencyToggle;
