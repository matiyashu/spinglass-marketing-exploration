"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { MethodStatusBar } from "@/components/method-status-bar";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";

export default function SwitchingRiskPage() {
  const { context } = useMarketingContext();
  const dimLabel = useDimLabel();
  const { data, loading } = useAsync(() => marketingLoader.verticals(context.brand_id), [context.brand_id]);

  const ranked = [...(data?.per_product ?? [])].sort((a, b) => b.competitor_overlap - a.competitor_overlap);
  const maxLeak = Math.max(0.01, ...ranked.map((p) => Math.abs(p.competitor_overlap)));

  return (
    <>
      <PageHeader
        eyebrow="Product / vertical"
        title="Switching risk"
        description={`Which products in ${dimLabel("brands", context.brand_id)} are most exposed to competitor salience.`}
      />
      <MethodStatusBar science="measured" methods={["competitive_leakage"]} />

      <SummaryBox title="What you're looking at">
        Switching risk is proxied by competitor-pattern overlap: how strongly each product's respondents also hold a
        competitor top-of-mind. Higher overlap means the product is more substitutable in memory — a defensive
        priority. This is a measured leakage signal, not a churn forecast.
      </SummaryBox>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {ranked.length > 0 && (
        <ChartCard title="Competitor overlap by product" subtitle="Ranked most-exposed first." science="measured">
          <div className="space-y-2">
            {ranked.map((p) => (
              <div key={p.product_id} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate font-medium">{p.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-red-400" style={{ width: `${(Math.abs(p.competitor_overlap) / maxLeak) * 100}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">{p.competitor_overlap.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </>
  );
}
