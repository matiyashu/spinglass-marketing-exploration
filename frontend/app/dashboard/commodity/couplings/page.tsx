"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { ChartFaq } from "@/components/chart-faq";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CommodityHeatmap } from "@/components/charts/commodity-heatmap";
import { useMode } from "@/lib/mode";
import {
  commodityLoader,
  SNAPSHOT_LABELS,
  type CommodityCouplingPayload,
  type CommoditySnapshot,
} from "@/lib/commodity";

type Mode = "spinglass" | "ising" | "mi";

const MODE_META: Record<Mode, { label: string; subtitle: string; scale: "diverging" | "positive" }> = {
  spinglass: {
    label: "Signed correlation (spin-glass)",
    subtitle: "Pairwise Pearson correlation on log returns within the window. Red cells counter-move; blue cells co-move.",
    scale: "diverging",
  },
  ising: {
    label: "|corr| (Ising benchmark)",
    subtitle: "Absolute correlation as a non-negative synchronisation strength. Blind to sign.",
    scale: "positive",
  },
  mi: {
    label: "Mutual information",
    subtitle: "Empirical MI with 4-quantile binning. Catches nonlinear dependence correlation misses.",
    scale: "positive",
  },
};

const FAQ = [
  {
    q: "Why three different couplings instead of one?",
    a: (
      <p>
        Each captures something different. Signed correlation preserves direction — a market where some assets
        counter-move at high spend looks structurally different from one where everything moves together. Absolute
        correlation collapses to a synchronisation strength. MI picks up nonlinear couplings (e.g. tail-risk
        clustering) that linear correlation misses.
      </p>
    ),
  },
  {
    q: "What's the negative-edge share telling me on the overview?",
    a: (
      <p>
        It&rsquo;s the fraction of upper-triangle correlations in the signed view that are negative. In calm regimes
        you have a healthy mix of co-moving and counter-moving pairs. In a stress regime the share collapses to near
        zero — everything moves together. That sign-collapse is the cleanest single signal of a regime change in
        commodity systems.
      </p>
    ),
  },
  {
    q: "Why three snapshots instead of an animated time series?",
    a: (
      <p>
        Animating 41 heatmaps is hard to interpret. The three reference windows (latest, COVID stress, 2022 energy
        crisis) are the qualitatively distinct regimes in the bundled panel. The rolling-metrics chart on the overview
        already shows the continuous evolution.
      </p>
    ),
  },
];

export default function CommodityCouplingsPage() {
  const [mode] = useMode();
  const [snapshot, setSnapshot] = useState<CommoditySnapshot>("latest");
  const [view, setView] = useState<Mode>("spinglass");
  const [payload, setPayload] = useState<CommodityCouplingPayload | null>(null);

  useEffect(() => {
    if (mode !== "demo-commodity") return;
    let alive = true;
    commodityLoader.couplings(snapshot).then((p) => {
      if (alive) setPayload(p);
    });
    return () => {
      alive = false;
    };
  }, [snapshot, mode]);

  const meta = MODE_META[view];
  const story = SNAPSHOT_LABELS[snapshot];

  return (
    <>
      <PageHeader
        eyebrow="Commodity · paper-aligned"
        title="Couplings heatmap"
        description="The 15×15 coupling matrix at a chosen reference window."
      />

      <SummaryBox title="What you're looking at">
        Pick a window (latest, COVID stress, or 2022 energy crisis) and a coupling mode (signed / |corr| / MI). The
        cells are J<sub>ij</sub> values; the diagonal is zero by convention. Notice how the COVID window pushes most
        signs positive (everything co-moves) while the latest window has more red cells (a healthy mix).
      </SummaryBox>

      {mode !== "demo-commodity" ? (
        <EmptyState expects="commodity" mode={mode} />
      ) : (
        <>
          <Tabs value={snapshot} onValueChange={(v) => setSnapshot(v as CommoditySnapshot)}>
            <TabsList>
              <TabsTrigger value="latest">Latest window</TabsTrigger>
              <TabsTrigger value="covid_stress">COVID stress</TabsTrigger>
              <TabsTrigger value="energy_stress">Energy crisis</TabsTrigger>
            </TabsList>
            <TabsContent value={snapshot}>
              <div className="space-y-1.5 rounded-md border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs">
                <p className="font-semibold text-primary">{story.short} · {story.window}</p>
                <p className="text-foreground/80">{story.story}</p>
              </div>
            </TabsContent>
          </Tabs>

          <Tabs value={view} onValueChange={(v) => setView(v as Mode)}>
            <TabsList>
              <TabsTrigger value="spinglass">Signed</TabsTrigger>
              <TabsTrigger value="ising">|corr|</TabsTrigger>
              <TabsTrigger value="mi">MI</TabsTrigger>
            </TabsList>
            <TabsContent value={view}>
              <ChartCard
                title={meta.label}
                subtitle={meta.subtitle}
                science={view === "mi" ? "experimental" : "measured"}
                footer={`Window length 90 business days. Assets are grouped by colour chip (precious metals / industrial / energy / grains / softs).`}
              >
                {payload ? (
                  <CommodityHeatmap assets={payload.assets} matrix={payload[view]} scale={meta.scale} />
                ) : (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                )}
              </ChartCard>
            </TabsContent>
          </Tabs>
        </>
      )}

      <ChartFaq items={FAQ} />
    </>
  );
}
