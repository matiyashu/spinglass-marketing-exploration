import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { CheckResult } from "@/lib/validate-csv";
import { cn } from "@/lib/utils";

const ICONS = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
} as const;

const COLORS = {
  ok: "text-emerald-600",
  warning: "text-amber-600",
  error: "text-destructive",
} as const;

interface ValidationChecklistProps {
  checks: CheckResult[];
  className?: string;
}

export function ValidationChecklist({ checks, className }: ValidationChecklistProps) {
  return (
    <ul className={cn("divide-y rounded-xl border bg-card", className)}>
      {checks.map((c) => {
        const Icon = ICONS[c.level];
        return (
          <li key={c.id} className="flex items-start gap-3 px-4 py-3 text-sm">
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", COLORS[c.level])} />
            <div className="min-w-0">
              <p className="font-medium leading-tight text-foreground">{c.label}</p>
              {c.detail && <p className="mt-0.5 text-xs text-muted-foreground">{c.detail}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
