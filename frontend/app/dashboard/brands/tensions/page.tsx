"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { MethodStatusBar } from "@/components/method-status-bar";
import { TriadList } from "@/components/charts/triad-list";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useWorkspace } from "@/lib/workspace";
import { useAsync } from "@/lib/use-async";
import { fetchCouplings } from "@/lib/marketing";
import { FEATURE_LABEL } from "@/lib/features";

export default function TensionsPage() {
  const [ws] = useWorkspace();
  const { context } = useMarketingContext();
  const dimLabel = useDimLabel();
  const { data, loading } = useAsync(() => fetchCouplings(ws, context), [ws, context.brand_id, context.segment]);

  return (
    <>
      <PageHeader
        eyebrow="Brand portfolio"
        title="Brand tensions"
        description={`Conflicting associations and contradictory triads for ${dimLabel("brands", context.brand_id)}.`}
      />
      <MethodStatusBar science="measured" methods={["brand_couplings"]} />

      <SummaryBox title="What you're looking at" tone="warn">
        Negative couplings are <strong>tensions</strong> — associations that resist being held together. A frustrated
        triad is a triangle of three associations with an odd number of negative edges, so they can never all be
        satisfied at once. These are the structural contradictions a repositioning has to resolve.
      </SummaryBox>

      {loading && <p className="text-sm text-muted-foreground">Computing…</p>}
      {data && (
        <>
          <ChartCard title="Strongest tensions" subtitle="The most negative association couplings in this context." science="measured">
            <ul className="space-y-1.5 text-sm">
              {data.top.conflicting.slice(0, 8).map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 border-b pb-1.5 last:border-0">
                  <span>{FEATURE_LABEL[e.a]} <span className="text-muted-foreground">vs</span> {FEATURE_LABEL[e.b]}</span>
                  <span className="font-mono text-red-700">{e.j.toFixed(3)}</span>
                </li>
              ))}
            </ul>
          </ChartCard>

          <ChartCard title="Contradictory triads" subtitle="Triangles of associations that cannot be mutually satisfied. Guardrail: all three |J| ≥ 0.12." science="measured">
            <TriadList triads={data.triads} />
          </ChartCard>
        </>
      )}
    </>
  );
}
