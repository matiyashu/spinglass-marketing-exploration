"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { ChartFaq } from "@/components/chart-faq";
import { MethodStatusBar } from "@/components/method-status-bar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MemoryHeatmap } from "@/components/charts/memory-heatmap";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useWorkspace } from "@/lib/workspace";
import { useAsync } from "@/lib/use-async";
import { fetchCouplings } from "@/lib/marketing";
import { FEATURE_LABEL } from "@/lib/features";

type View = "spin_glass" | "ising" | "mi";

const META: Record<View, { label: string; subtitle: string; scale: "diverging" | "positive"; science: "measured" | "experimental" }> = {
  spin_glass: { label: "Signed couplings (spin-glass)", subtitle: "Signed correlation of binarized associations. Teal reinforces, red conflicts.", scale: "diverging", science: "measured" },
  ising: { label: "|corr| synchronisation (Ising)", subtitle: "Absolute correlation — total association strength, blind to sign.", scale: "positive", science: "measured" },
  mi: { label: "Mutual information", subtitle: "Nonlinear dependence with quantile binning. Signed MI is a heuristic.", scale: "positive", science: "experimental" },
};

const FAQ = [
  { q: "What is a coupling here?", a: <p>The signed correlation between two brand associations across respondents in the selected context. A positive coupling means the two tend to be held together; a negative one means holding one tends to exclude the other — a tension.</p> },
  { q: "Why does the structure change with context?", a: <p>Couplings are estimated per brand / segment. Different audiences encode the brand differently, so the memory map for premium loyalists is not the same as for value seekers. Narrow the context above to see it shift.</p> },
];

export default function MemoryMapPage() {
  const [ws] = useWorkspace();
  const { context } = useMarketingContext();
  const dimLabel = useDimLabel();
  const [view, setView] = useState<View>("spin_glass");
  const { data, loading, error } = useAsync(() => fetchCouplings(ws, context), [ws, context.brand_id, context.segment]);
  const meta = META[view];

  return (
    <>
      <PageHeader
        eyebrow="Brand portfolio"
        title="Brand memory map"
        description={`The association coupling structure for ${dimLabel("brands", context.brand_id)}${context.segment ? ` · ${dimLabel("segments", context.segment)}` : ""}.`}
      />
      <MethodStatusBar science={meta.science} methods={["brand_couplings"]} note={ws === "live" ? "Live compute" : "Bundled demo"} />

      <SummaryBox title="What you're looking at">
        Each cell is the coupling J<sub>ij</sub> between two of the ten brand associations, estimated from respondent
        co-movement. The diagonal is zero. Reinforcing clusters (teal) show meanings that travel together; red cells
        are tensions. Competitor salience usually sits in opposition to brand linkage.
      </SummaryBox>

      {error && <p className="text-sm text-destructive">Could not load couplings: {error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Computing couplings…</p>}

      {data && (
        <>
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="spin_glass">Signed</TabsTrigger>
              <TabsTrigger value="ising">|corr|</TabsTrigger>
              <TabsTrigger value="mi">MI</TabsTrigger>
            </TabsList>
            <TabsContent value={view}>
              <ChartCard title={meta.label} subtitle={meta.subtitle} science={meta.science} footer={`Estimated from ${data.summary.n_respondents.toLocaleString()} respondent rows.`}>
                <MemoryHeatmap features={data.features} matrix={data[view]} scale={meta.scale} />
              </ChartCard>
            </TabsContent>
          </Tabs>

          <section className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Top reinforcing</p>
              <ul className="mt-2 space-y-1 text-sm">
                {data.top.reinforcing.slice(0, 6).map((e, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{FEATURE_LABEL[e.a]} · {FEATURE_LABEL[e.b]}</span>
                    <span className="font-mono text-emerald-700">+{e.j.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Top conflicting</p>
              <ul className="mt-2 space-y-1 text-sm">
                {data.top.conflicting.slice(0, 6).map((e, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{FEATURE_LABEL[e.a]} · {FEATURE_LABEL[e.b]}</span>
                    <span className="font-mono text-red-700">{e.j.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      <ChartFaq items={FAQ} />
    </>
  );
}
