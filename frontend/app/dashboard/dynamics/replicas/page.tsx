"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { ChartFaq } from "@/components/chart-faq";
import { MethodStatusBar } from "@/components/method-status-bar";
import { KpiTile } from "@/components/kpi-tile";
import { PqHistogram } from "@/components/charts/pq-histogram";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";

const FAQ = [
  { q: "Why two different P(q) histograms?", a: <p>They answer different questions. <strong>Landscape replicas</strong> run independent MCMC chains under one fixed coupling matrix, field and temperature — a <em>simulation</em> of whether the declared model has one or many attractor states. <strong>Estimation-stability replicas</strong> resample the data to ask whether the estimated couplings themselves are stable. Mixing them is a common error.</p> },
  { q: "Can a broad P(q) prove replica-symmetry breaking?", a: <p>No. In a finite brand panel with ten features, a broad or multimodal P(q) is a descriptive signal of competing meanings — not proof of an RSB phase. The page labels each view accordingly.</p> },
];

export default function ReplicasPage() {
  const { context } = useMarketingContext();
  const dimLabel = useDimLabel();
  const { data, loading } = useAsync(() => marketingLoader.replicas(context.brand_id), [context.brand_id]);

  return (
    <>
      <PageHeader
        eyebrow="Dynamics & stability"
        title="Replica / fragmentation"
        description={`Two distinct replica views for ${dimLabel("brands", context.brand_id)}: simulated landscape fragmentation vs estimation stability.`}
      />
      <MethodStatusBar science="measured" methods={["replica_estimation"]} note="estimation = measured · landscape = simulation" />

      <SummaryBox title="What you're looking at">
        The overlap distribution P(q) summarises how similar independent replicas are. We keep two separate panels:
        one is a <strong>simulation</strong> from fixed parameters (does the declared landscape have competing
        states?), the other is <strong>measured by resampling</strong> (are the estimated couplings stable?). They
        must never be conflated.
      </SummaryBox>

      {loading && <p className="text-sm text-muted-foreground">Computing replicas…</p>}
      {data && (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <KpiTile label="Estimation overlap" value={data.estimation.mean.toFixed(3)} hint="bootstrap mean q — closer to 1 = stable couplings" highlight />
            <KpiTile label="Landscape overlap" value={data.landscape.mean.toFixed(3)} hint="mean q across simulated chains" />
            <KpiTile label="Memory rigidity" value={data.rigidity_proxy.toFixed(2)} unit="proxy" hint="(1/N)Σ⟨sᵢ⟩² — not the EA order parameter" />
          </section>

          <div className="grid gap-3 md:grid-cols-2">
            <ChartCard title="Estimation-stability P(q)" subtitle="Bootstrap resamples of the respondents. Measured." science="measured" footer="Concentrated near 1 = the coupling structure is robust to sampling.">
              <PqHistogram pq={data.estimation} color="#14b8a6" />
            </ChartCard>
            <ChartCard title="Landscape P(q)" subtitle="Independent chains under fixed J, h, β. Simulation." science="simulation" footer="Broad / multimodal = the declared landscape supports competing states — descriptive, not RSB proof.">
              <PqHistogram pq={data.landscape} color="#60a5fa" />
            </ChartCard>
          </div>
        </>
      )}

      <ChartFaq items={FAQ} />
    </>
  );
}
