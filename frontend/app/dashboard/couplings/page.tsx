"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { ChartFaq } from "@/components/chart-faq";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CouplingHeatmap } from "@/components/charts/coupling-heatmap";
import { demoLoader, type CouplingMode, type CouplingPayload } from "@/lib/demo-loader";
import { useMode } from "@/lib/mode";

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

const FAQ = [
  {
    q: "Which cells should I look at first?",
    a: (
      <p>
        Sort visually by intensity. The most saturated red cells are your strongest tensions — those tell you where the
        brand&rsquo;s meaning is internally contradictory. The most saturated blue cells are reinforcing pairs you can
        deliberately leverage in creative.
      </p>
    ),
  },
  {
    q: "What does the number inside each cell mean?",
    a: (
      <p>
        It&rsquo;s the coupling J<sub>ij</sub> — in spin-glass mode that&rsquo;s signed Pearson correlation between the
        two binarised columns. Values range roughly from −1 to +1; in practice the recovered values fall in ±0.5 for
        this kind of data. The legend below the chart shows the maximum |J| in the current view.
      </p>
    ),
  },
  {
    q: "Why are the diagonal cells empty?",
    a: (
      <p>
        Self-coupling is zero by convention (a spin doesn&rsquo;t reinforce itself). The diagonal is set to 0 in every
        coupling matrix the kernel produces.
      </p>
    ),
  },
  {
    q: "Which mode should I trust?",
    a: (
      <>
        <p>
          <strong>Start with spin-glass.</strong> It preserves the sign of the relationship, which is where most of the
          diagnostic value sits. Negative couplings are invisible in Ising.
        </p>
        <p>
          <strong>Use Ising</strong> as a coherence benchmark: it tells you how strongly the system moves together
          overall, ignoring direction.
        </p>
        <p>
          <strong>Use MI</strong> as a second pass when you suspect nonlinear relationships — e.g. trust only fires
          when both fun <em>and</em> distinctive asset are active.
        </p>
      </>
    ),
  },
  {
    q: "A coupling I expected isn't there. Why?",
    a: (
      <p>
        Three common causes. (1) Class imbalance — a feature that is almost always 1 carries almost no information,
        regardless of its true semantic weight. (2) Sample size — couplings stabilise around 200+ rows. (3) The signal
        actually isn&rsquo;t there in this category at this moment — interesting on its own.
      </p>
    ),
  },
  {
    q: "What's a 'big' coupling for brand-health data?",
    a: (
      <p>
        On binarised survey data, anything above ~0.25 in magnitude is structurally meaningful. ~0.4+ is large.
        Anything ~0.6+ usually means you&rsquo;ve essentially measured the same construct twice and should consolidate.
      </p>
    ),
  },
];

export default function CouplingsPage() {
  const [mode] = useMode();
  const [couplingMode, setCouplingMode] = useState<CouplingMode>("spinglass");
  const [payload, setPayload] = useState<CouplingPayload | null>(null);

  useEffect(() => {
    if (mode !== "demo") return;
    let alive = true;
    demoLoader.couplings(couplingMode).then((p) => {
      if (alive) setPayload(p);
    });
    return () => {
      alive = false;
    };
  }, [couplingMode, mode]);

  const meta = MODE_DESCRIPTIONS[couplingMode];

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

      {mode === "live" ? (
        <EmptyState
          title="Upload your tracker to compute couplings"
          body="In live mode, this heatmap is computed from your CSV. Bring your data on the Upload tab — the validator will tell you exactly what's missing — then start the optional FastAPI service to populate this view."
        />
      ) : (
        <Tabs value={couplingMode} onValueChange={(v) => setCouplingMode(v as CouplingMode)}>
          <TabsList>
            <TabsTrigger value="spinglass">Spin-glass</TabsTrigger>
            <TabsTrigger value="ising">Ising</TabsTrigger>
            <TabsTrigger value="mi">MI</TabsTrigger>
          </TabsList>

          <TabsContent value={couplingMode}>
            <ChartCard
              title={meta.label}
              subtitle={meta.subtitle}
              footer="Hover any cell for the exact J value. Diagonal cells are zero by convention."
            >
              {payload ? (
                <CouplingHeatmap features={payload.features} matrix={payload.matrix} scale={meta.scale} />
              ) : (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
            </ChartCard>
          </TabsContent>
        </Tabs>
      )}

      <ChartFaq
        intro="The heatmap encodes structure, not magnitude of effect. Use the answers below before drawing any conclusion."
        items={FAQ}
      />
    </>
  );
}
