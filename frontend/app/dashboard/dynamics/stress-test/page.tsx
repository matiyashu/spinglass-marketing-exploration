"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { MethodStatusBar } from "@/components/method-status-bar";
import { MovementWaterfall } from "@/components/charts/movement-waterfall";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";

export default function StressTestPage() {
  const { context } = useMarketingContext();
  const dimLabel = useDimLabel();
  const { data } = useAsync(() => marketingLoader.stability(context.brand_id), [context.brand_id]);

  const features = (data?.susceptibility ?? []).map((s) => s.feature);
  const values = (data?.susceptibility ?? []).map((s) => s.chi);

  return (
    <>
      <PageHeader
        eyebrow="Dynamics & stability"
        title="Stress test · campaign sensitivity"
        description={`Which associations of ${dimLabel("brands", context.brand_id)} are easiest to move under a field perturbation.`}
      />
      <MethodStatusBar science="simulation" methods={["replica_estimation"]} note="susceptibility χᵢ = d⟨sᵢ⟩/dhᵢ" />

      <SummaryBox title="What you're looking at" tone="info">
        Susceptibility measures how much each association responds to a small push on its own field — the simulated
        sensitivity χ<sub>i</sub>. High-susceptibility associations are the movable levers a campaign can shift; low-
        susceptibility ones are entrenched. Full parameter-chaos robustness (overlap under market shocks) is a
        simulation extension on top of this.
      </SummaryBox>

      {data && (
        <ChartCard title="Association susceptibility" subtitle="Numerical χᵢ from the spin-glass kernel. Higher = easier to move." science="simulation" footer="Entrenched associations (low χ) resist campaigns; movable ones (high χ) are where spend has leverage.">
          <MovementWaterfall features={features} values={values} />
        </ChartCard>
      )}
    </>
  );
}
