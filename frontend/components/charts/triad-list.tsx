"use client";

import { AlertTriangle } from "lucide-react";
import { FEATURE_LABEL } from "@/lib/features";
import type { Triad } from "@/lib/marketing";

/** Contradictory (frustrated) triads: an odd number of negative edges. */
export function TriadList({ triads }: { triads: Triad[] }) {
  if (triads.length === 0) {
    return (
      <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        No contradictory triads pass the strength guardrail (all three |J| ≥ 0.12) in this context. A coherent
        memory with few frustrated triangles is a healthy sign — the guardrail is doing its job.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {triads.map((t, i) => (
        <li key={i} className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-foreground">
              {t.features.map((f) => FEATURE_LABEL[f]).join(" · ")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              couplings {t.couplings.map((c) => c.toFixed(2)).join(", ")} — an odd number are negative, so the three
              associations cannot all be mutually satisfied at once.
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
