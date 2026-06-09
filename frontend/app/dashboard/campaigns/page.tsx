"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleSlash } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { MethodStatusBar } from "@/components/method-status-bar";
import { useMarketingContext, useDimLabel } from "@/lib/context";

const SUBPAGES = [
  { href: "/dashboard/campaigns/creative-memory", label: "Creative memory pattern", body: "The association vector the creative intends to activate." },
  { href: "/dashboard/campaigns/field-response", label: "Field response", body: "Which associations actually moved, pre → during." },
  { href: "/dashboard/campaigns/simulator", label: "Scenario simulator", body: "Simulate target retrieval at different spend levels." },
  { href: "/dashboard/campaigns/validation", label: "Observed validation", body: "Calibrate against outcomes — when outcome data exists." },
];

export default function CampaignsPage() {
  const { context, dimensions, setContext } = useMarketingContext();
  const dimLabel = useDimLabel();
  const campaigns = (dimensions?.campaigns ?? []).filter((c) => c.brand_id === context.brand_id);

  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title="Campaign overview"
        description={`Campaigns for ${dimLabel("brands", context.brand_id)}. Pick one to make it the active context.`}
      />
      <MethodStatusBar science="measured" methods={["campaign_field", "observed_response", "outcome_validation"]} />

      <SummaryBox title="What you're looking at">
        Each campaign declares a creative memory pattern — the associations it means to activate or suppress — and
        runs over a window of tracker waves. We separate <strong>declared-field simulation</strong> from{" "}
        <strong>observed validation</strong>: the simulator is always available, but outcome calibration only unlocks
        for campaigns that ship outcome data.
      </SummaryBox>

      <section className="grid gap-3 md:grid-cols-3">
        {campaigns.map((c) => (
          <button
            key={c.id}
            onClick={() => setContext({ campaign_id: c.id, product_id: c.product_id ?? null })}
            className={`rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 ${context.campaign_id === c.id ? "border-primary/40 bg-primary/5" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{c.id}</span>
              {c.has_outcomes ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700"><CheckCircle2 className="h-3 w-3" /> outcomes</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><CircleSlash className="h-3 w-3" /> no outcomes</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{dimLabel("products", c.product_id ?? "")}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{c.start_date?.slice(0, 7)} → {c.end_date?.slice(0, 7)}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {SUBPAGES.map((s) => (
          <Link key={s.href} href={s.href} className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5">
            <span className="text-sm font-semibold">{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.body}</span>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">Open <ArrowRight className="h-3 w-3" /></span>
          </Link>
        ))}
      </section>
    </>
  );
}
