"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { MethodStatusBar } from "@/components/method-status-bar";
import { CampaignRequired } from "@/components/campaign-required";
import { useMarketingContext } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";
import { FEATURE_LABEL } from "@/lib/features";

export default function CreativeMemoryPage() {
  const { context } = useMarketingContext();
  const cid = context.campaign_id;
  const { data } = useAsync(() => (cid ? marketingLoader.campaign(cid) : Promise.resolve(null)), [cid]);

  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title="Creative memory pattern"
        description="The declared target vector ξ — which associations the creative intends to activate (+) or suppress (−)."
      />
      <MethodStatusBar science="illustrative" methods={["campaign_field"]} note="declared by strategy, not measured" />

      {!cid && <CampaignRequired />}

      {data && (
        <>
          <SummaryBox title="What you're looking at">
            This is the Hopfield-style memory pattern the campaign declares as its goal — sourced from strategy or copy
            testing, not measured. The field-response page then checks which of these intended associations actually
            moved.
          </SummaryBox>

          <ChartCard title={`Creative ${data.campaign.creative_id} target pattern`} subtitle="From the creative memory map." science="illustrative">
            <div className="space-y-1.5">
              {data.creative_map.map((row) => (
                <div key={row.feature_name} className="flex items-center gap-3 text-sm">
                  <span className="w-40 shrink-0">{FEATURE_LABEL[row.feature_name]}</span>
                  <span className={`inline-flex h-5 w-8 items-center justify-center rounded text-xs font-semibold ${row.target_spin > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {row.target_spin > 0 ? "+1" : "−1"}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${row.target_spin > 0 ? "bg-emerald-400" : "bg-red-400"}`} style={{ width: `${row.intended_strength * 100}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground">{row.intended_strength.toFixed(1)}</span>
                  <span className="w-20 text-right text-[10px] uppercase tracking-wider text-muted-foreground">{row.evidence_source}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </>
      )}
    </>
  );
}
