"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CouplingHeatmap } from "@/components/charts/coupling-heatmap";
import { demoLoader, type CouplingMode, type CouplingPayload } from "@/lib/demo-loader";

const MODE_DESCRIPTIONS: Record<CouplingMode, { label: string; subtitle: string; scale: "diverging" | "positive" }> = {
  spinglass: {
    label: "Spin-glass (signed)",
    subtitle: "Pearson correlation between binarised columns. Negative cells are tensions; positive cells reinforce.",
    scale: "diverging",
  },
  ising: {
    label: "Ising (absolute)",
    subtitle: "|corr| as a non-negative synchronisation strength. Useful as a coherence benchmark; blind to direction.",
    scale: "positive",
  },
  mi: {
    label: "Mutual information (signed)",
    subtitle:
      "Normalised MI signed by the correlation sign. Picks up nonlinear couplings that correlation alone misses.",
    scale: "diverging",
  },
};

export default function CouplingsPage() {
  const [mode, setMode] = useState<CouplingMode>("spinglass");
  const [payload, setPayload] = useState<CouplingPayload | null>(null);

  useEffect(() => {
    let alive = true;
    demoLoader.couplings(mode).then((p) => {
      if (alive) setPayload(p);
    });
    return () => {
      alive = false;
    };
  }, [mode]);

  const meta = MODE_DESCRIPTIONS[mode];

  return (
    <>
      <PageHeader
        eyebrow="Analysis"
        title="Couplings heatmap"
        description="Pairwise structure of the brand-association system. Blue cells reinforce; red cells are in tension."
      />

      <SummaryBox title="What you're looking at">
        Every cell J<sub>ij</sub> is a coupling between two brand associations. In the spin-glass view, a strongly
        positive cell means the two move together; a strongly negative cell means they compete. Toggle modes to compare
        signed (spin-glass), absolute (Ising) and nonlinear (MI) views. The 10 features are listed in the same order on
        both axes.
      </SummaryBox>

      <Tabs value={mode} onValueChange={(v) => setMode(v as CouplingMode)}>
        <TabsList>
          <TabsTrigger value="spinglass">Spin-glass</TabsTrigger>
          <TabsTrigger value="ising">Ising</TabsTrigger>
          <TabsTrigger value="mi">MI</TabsTrigger>
        </TabsList>

        <TabsContent value={mode}>
          <ChartCard
            title={meta.label}
            subtitle={meta.subtitle}
            footer="How to read it: hover any cell for the exact J value. Diagonal cells are zero by convention."
          >
            {payload ? (
              <CouplingHeatmap features={payload.features} matrix={payload.matrix} scale={meta.scale} />
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </ChartCard>
        </TabsContent>
      </Tabs>
    </>
  );
}
