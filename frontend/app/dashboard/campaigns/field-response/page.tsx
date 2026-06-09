"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { MethodStatusBar } from "@/components/method-status-bar";
import { KpiTile } from "@/components/kpi-tile";
import { CampaignRequired } from "@/components/campaign-required";
import { MovementWaterfall } from "@/components/charts/movement-waterfall";
import { useMarketingContext } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";

export default function FieldResponsePage() {
  const { context } = useMarketingContext();
  const cid = context.campaign_id;
  const { data } = useAsync(() => (cid ? marketingLoader.campaign(cid) : Promise.resolve(null)), [cid]);

  const pm = data?.phase_means;
  const movement = pm?.pre && pm?.during ? pm.during.map((d, i) => d - (pm.pre as number[])[i]) : null;
  const po = data?.phase_overlap;
  const lift = po && po.pre != null && po.during != null ? po.during - po.pre : null;

  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title="Field response"
        description="Which associations moved while the campaign field was active — pre vs during, on the targeted audience."
      />
      <MethodStatusBar science="measured" methods={["observed_response"]} note="pre/during tracker waves" />

      {!cid && <CampaignRequired />}

      {data && (
        <>
          <SummaryBox title="What you're looking at">
            The campaign acts as an external field. We compare the mean association state before the flight to during
            it, on the campaign&rsquo;s targeted market and segment. Teal bars rose, red fell. A campaign can lift its
            intended associations, do nothing on a saturated audience, or — worst case — only raise category salience.
          </SummaryBox>

          <section className="grid gap-3 md:grid-cols-3">
            <KpiTile label="Target overlap · pre" value={po?.pre?.toFixed(3) ?? "—"} />
            <KpiTile label="Target overlap · during" value={po?.during?.toFixed(3) ?? "—"} highlight />
            <KpiTile label="Lift" value={lift != null ? (lift >= 0 ? "+" : "") + lift.toFixed(3) : "—"} trend={lift != null ? (lift > 0.01 ? "up" : lift < -0.01 ? "down" : "flat") : undefined} />
          </section>

          {movement && (
            <ChartCard title="Association movement (during − pre)" subtitle="Per-feature change in mean spin over the campaign window." science="measured">
              <MovementWaterfall features={data.features} values={movement} />
            </ChartCard>
          )}
        </>
      )}
    </>
  );
}
