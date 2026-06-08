"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { ChartFaq } from "@/components/chart-faq";
import { EmptyState } from "@/components/empty-state";
import { ScienceBadge } from "@/components/science-badge";
import { RollingMetricsLine } from "@/components/charts/rolling-metrics-line";
import { useMode } from "@/lib/mode";
import { commodityLoader, type RollingMetric } from "@/lib/commodity";

const FAQ = [
  {
    q: "What does each line measure?",
    a: (
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>avg signed corr</strong> — mean Pearson correlation across the 105 unique pairs.</li>
        <li><strong>avg |corr|</strong> — same as above but absolute. The Ising synchronisation benchmark.</li>
        <li><strong>avg MI</strong> — mean mutual information with quantile binning. Picks up nonlinear dependence.</li>
        <li><strong>largest eigenvalue</strong> — top eigenvalue of the signed-correlation matrix. Lifts in stress.</li>
        <li><strong>negative-edge share</strong> — fraction of pairs that counter-move (right axis, dashed).</li>
      </ul>
    ),
  },
  {
    q: "Is this a QA target for the live backend?",
    a: (
      <p>
        Yes. The CSV that drives this chart is also bundled at{" "}
        <code className="font-mono text-xs">backend/sample_data/commodity_paper_aligned_rolling_metrics.csv</code>.
        When the optional FastAPI service is running, the <code>/couplings/rolling</code> endpoint should reproduce
        these exact values from the price series. Use it as a regression test.
      </p>
    ),
  },
];

export default function CommodityRollingPage() {
  const [mode] = useMode();
  const [records, setRecords] = useState<RollingMetric[]>([]);

  useEffect(() => {
    if (mode === "demo-commodity") commodityLoader.rolling().then((p) => setRecords(p.records));
  }, [mode]);

  return (
    <>
      <PageHeader
        eyebrow="Commodity · paper-aligned"
        title="Rolling-metric table"
        description="Every 90-day window summarised in five numbers. The chart on the overview is a visualisation of this table."
        actions={<ScienceBadge status="measured" inline />}
      />

      <SummaryBox title="What you're looking at">
        The same rolling-window summaries as the overview chart, but in table form so you can compare specific values.
        Use this when validating that the backend reproduces these numbers exactly.
      </SummaryBox>

      {mode !== "demo-commodity" ? (
        <EmptyState expects="commodity" mode={mode} />
      ) : (
        <>
          <ChartCard
            title="Rolling regime indicators (chart)"
            subtitle="Same trace as the overview, pinned here for direct comparison with the table below."
            science="measured"
          >
            <RollingMetricsLine records={records} />
          </ChartCard>

          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">Window start</th>
                  <th className="px-3 py-2 font-semibold">Window end</th>
                  <th className="px-3 py-2 font-semibold">avg signed</th>
                  <th className="px-3 py-2 font-semibold">avg |corr|</th>
                  <th className="px-3 py-2 font-semibold">avg MI</th>
                  <th className="px-3 py-2 font-semibold">λ_max (signed)</th>
                  <th className="px-3 py-2 font-semibold">λ_max (|corr|)</th>
                  <th className="px-3 py-2 font-semibold">neg-edge share</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono">
                {records.map((r) => (
                  <tr key={r.window_start}>
                    <td className="px-3 py-1.5">{r.window_start}</td>
                    <td className="px-3 py-1.5">{r.window_end}</td>
                    <td className="px-3 py-1.5">{r.avg_signed_coupling.toFixed(3)}</td>
                    <td className="px-3 py-1.5">{r.avg_abs_coupling_ising.toFixed(3)}</td>
                    <td className="px-3 py-1.5">{r.avg_mutual_information.toFixed(3)}</td>
                    <td className="px-3 py-1.5">{r.largest_eigenvalue_signed.toFixed(3)}</td>
                    <td className="px-3 py-1.5">{r.largest_eigenvalue_ising.toFixed(3)}</td>
                    <td className="px-3 py-1.5">{(r.negative_edge_share * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ChartFaq items={FAQ} />
    </>
  );
}
