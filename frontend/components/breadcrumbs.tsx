"use client";

import { ChevronRight } from "lucide-react";
import { useMarketingContext } from "@/lib/context";
import { contextTrail } from "@/components/context-selector";

export function Breadcrumbs() {
  const { dimensions, context } = useMarketingContext();
  const trail = contextTrail(dimensions, context);
  if (trail.length === 0) return null;
  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground" aria-label="Marketing context">
      {trail.map((part, i) => (
        <span key={`${part}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" />}
          <span className={i === trail.length - 1 ? "font-medium text-foreground" : ""}>{part}</span>
        </span>
      ))}
    </nav>
  );
}
