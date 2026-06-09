"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { MethodStatusBar } from "@/components/method-status-bar";
import { SegmentOverlap } from "@/components/charts/segment-overlap";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";

export default function SegmentDifferencesPage() {
  const { context, setContext } = useMarketingContext();
  const dimLabel = useDimLabel();
  const { data, loading } = useAsync(() => marketingLoader.segments(context.brand_id), [context.brand_id]);

  return (
    <>
      <PageHeader
        eyebrow="Product / vertical"
        title="Segment differences"
        description={`Whether audiences hold the same memory of ${dimLabel("brands", context.brand_id)} or fragment into different meanings.`}
      />
      <MethodStatusBar science="measured" methods={["replica_estimation"]} note="overlap of per-segment mean states" />

      <SummaryBox title="What you're looking at">
        Each cell is the overlap of two segments' mean association vectors — how similarly they encode the brand. Off-
        diagonal values near 1 mean a shared memory; lower values mean a segment needs its own creative. This is an
        estimation-stability view across audiences, not a simulated landscape.
      </SummaryBox>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {data && (
        <>
          <ChartCard title="Cross-segment memory overlap" subtitle="Cosine overlap of per-segment mean spin vectors." science="measured">
            <SegmentOverlap segments={data.overlap.segments} matrix={data.overlap.matrix} />
          </ChartCard>

          <ChartCard title="Per-segment coherence" subtitle="Click a segment to focus every screen on it." science="measured">
            <div className="grid gap-2 md:grid-cols-2">
              {data.per_segment.map((s) => (
                <button
                  key={s.segment}
                  onClick={() => setContext({ segment: s.segment })}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:border-primary/40 ${context.segment === s.segment ? "border-primary/40 bg-primary/5" : "bg-card"}`}
                >
                  <span className="capitalize">{s.segment.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">λ_max {s.largest_eigenvalue_signed.toFixed(2)} · rigidity {s.rigidity_proxy.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </ChartCard>
        </>
      )}
    </>
  );
}
