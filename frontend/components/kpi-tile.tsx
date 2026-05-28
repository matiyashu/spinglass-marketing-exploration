import { cn } from "@/lib/utils";

interface KpiTileProps {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  trend?: "up" | "down" | "flat";
  highlight?: boolean;
  className?: string;
}

export function KpiTile({ label, value, unit, hint, trend, highlight, className }: KpiTileProps) {
  const trendColor =
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : trend === "flat" ? "—" : null;
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        highlight && "border-primary/30 bg-primary/5",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={cn("text-2xl font-semibold tracking-tight", highlight && "text-primary")}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        {arrow && <span className={cn("ml-auto text-xs font-medium", trendColor)}>{arrow}</span>}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
