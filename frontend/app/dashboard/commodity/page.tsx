"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Network, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { KpiTile } from "@/components/kpi-tile";
import { ScienceBadge } from "@/components/science-badge";
import { EmptyState } from "@/components/empty-state";
import { RollingMetricsLine } from "@/components/charts/rolling-metrics-line";
import { useMode } from "@/lib/mode";
import { commodityLoader, type RollingMetric } from "@/lib/commodity";

export default function CommodityOverviewPage() {
  const [mode] = useMode();
  const [records, setRecords] = useState<RollingMetric[]>([]);

  useEffect(() => {
    if (mode === "demo-commodity") commodityLoader.rolling().then((p) => setRecords(p.records));
  }, [mode]);

  const stats = useMemo(() => {
    if (records.length === 0) return null;
    const latest = records[records.length - 1];
    const peakEig = records.reduce((acc, r) => (r.largest_eigenvalue_signed > acc.largest_eigenvalue_signed ? r : acc));
    const minNeg = records.reduce((acc, r) => (r.negative_edge_share < acc.negative_edge_share ? r : acc));
    return { latest, peakEig, minNeg };
  }, [records]);

  return (
    <>
      <PageHeader
        eyebrow="Commodity · paper-aligned"
        title="Cross-asset interdependence over time"
        description="Rolling signed correlation, |corr| Ising benchmark, mutual information, and largest eigenvalue across a 15-asset commodity panel."
        actions={<ScienceBadge status="measured" inline />}
      />

      <SummaryBox title="What you're looking at">
        Each window is 90 business days, stepped 30 days forward. For every window we compute the full
        15×15 coupling matrix in three modes (signed correlation, absolute correlation, mutual information), then
        summarise it with average coupling and the largest eigenvalue. Regime shifts show up as simultaneous lifts
        in the lines below: synchronisation rises, the negative-edge share collapses, and the leading eigenvalue
        grows.
      </SummaryBox>

      {mode !== "demo-commodity" ? (
        <EmptyState expects="commodity" mode={mode} />
      ) : (
        <>
          {stats && (
            <section className="grid gap-3 md:grid-cols-3">
              <KpiTile
                label="Latest window"
                value={stats.latest.largest_eigenvalue_signed.toFixed(2)}
                unit="largest eigenvalue (signed)"
                hint={`${stats.latest.window_start} → ${stats.latest.window_end}`}
              />
              <KpiTile
                label="Peak synchronisation"
                value={stats.peakEig.largest_eigenvalue_signed.toFixed(2)}
                unit="largest eigenvalue"
                hint={`window starting ${stats.peakEig.window_start}`}
                highlight
              />
              <KpiTile
                label="Lowest negative-edge share"
                value={(stats.minNeg.negative_edge_share * 100).toFixed(0) + "%"}
                hint={`window starting ${stats.minNeg.window_start} — the closer to 0 %, the more uniformly co-moving the market is`}
              />
            </section>
          )}

          <ChartCard
            title="Rolling regime indicators"
            subtitle="Average signed correlation, absolute correlation, MI, leading eigenvalue, and negative-edge share. Red and amber bands mark COVID and the 2022 energy crisis."
            science="measured"
            footer="The negative-edge share is the fraction of upper-triangle entries with sign < 0 in the signed-correlation view. In stress regimes it tends toward 0 — the market moves as one."
          >
            <RollingMetricsLine records={records} />
          </ChartCard>

          <section className="grid gap-3 md:grid-cols-2">
            <Link
              href="/dashboard/commodity/couplings"
              className="group flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex items-center gap-2 text-primary">
                <Network className="h-4 w-4" />
                <span className="text-sm font-semibold text-foreground">Couplings heatmap</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Snapshots of the 15×15 coupling matrix at three reference windows — latest, COVID stress, energy crisis.
                Toggle between signed correlation, |corr| Ising and mutual information.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
            <Link
              href="/dashboard/commodity/rolling"
              className="group flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-semibold text-foreground">Rolling-metric table</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The full rolling-window table the chart above is plotted from. Use this to copy specific values into a
                deck or to validate that the backend live-compute endpoint reproduces these numbers exactly.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </section>
        </>
      )}
    </>
  );
}
