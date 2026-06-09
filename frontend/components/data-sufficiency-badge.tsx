"use client";

import { CheckCircle2, CircleSlash } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  enabled: boolean;
  label: string;
  missing?: string[];
  className?: string;
}

/** A small pill telling the user whether the current data supports an analysis. */
export function DataSufficiencyBadge({ enabled, label, missing, className }: Props) {
  return (
    <span
      title={enabled ? "Enabled by the supplied data" : `Needs: ${(missing ?? []).join(", ")}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
        enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-muted bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      {enabled ? <CheckCircle2 className="h-3 w-3" /> : <CircleSlash className="h-3 w-3" />}
      {label}
    </span>
  );
}
