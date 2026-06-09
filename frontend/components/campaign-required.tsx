"use client";

import Link from "next/link";
import { Radio } from "lucide-react";

/** Shown on campaign sub-pages when no campaign is selected in the context bar. */
export function CampaignRequired() {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border bg-card px-5 py-6">
      <div className="flex items-center gap-2 text-primary">
        <Radio className="h-4 w-4" />
        <p className="text-sm font-semibold text-foreground">No campaign selected</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Pick a campaign in the context bar above, or choose one from the{" "}
        <Link href="/dashboard/campaigns" className="text-primary hover:underline">campaign overview</Link>.
      </p>
    </div>
  );
}
