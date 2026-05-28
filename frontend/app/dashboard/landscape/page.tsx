"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { EnergyLandscape } from "@/components/charts/energy-landscape";
import { HysteresisCurve } from "@/components/charts/hysteresis-curve";
import { demoLoader, type HysteresisPoint, type LandscapePoint } from "@/lib/demo-loader";

export default function LandscapePage() {
  const [landscape, setLandscape] = useState<LandscapePoint[]>([]);
  const [hysteresis, setHysteresis] = useState<HysteresisPoint[]>([]);

  useEffect(() => {
    demoLoader.landscape().then((p) => setLandscape(p.points));
    demoLoader.hysteresis().then((p) => setHysteresis(p.points));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Analysis"
        title="Energy landscape & hysteresis"
        description="Where the system is stable, and whether the path you took to get there matters."
      />

      <SummaryBox title="What you're looking at">
        The energy landscape plots energy against brand state, from competitor-aligned (−1) to target-aligned (+1).
        Local minima are stable attractors. The hysteresis loop shows that the brand&rsquo;s aggregate state at a given
        marketing pressure h depends on whether you arrived from below or above — campaigns are path-dependent.
      </SummaryBox>

      <ChartCard
        title="Energy landscape"
        subtitle="Baseline → during campaign field → after memory reinforcement."
        footer="A successful long-term campaign deepens the target-side basin so the new minimum survives after the field is removed."
      >
        <EnergyLandscape points={landscape} />
      </ChartCard>

      <ChartCard
        title="Hysteresis loop"
        subtitle="Aggregate brand state M vs marketing field h, swept up then back down."
        footer="The width between the two curves is the 'stickiness' budget: once flipped, the state holds at lower maintenance spend."
      >
        <HysteresisCurve points={hysteresis} />
      </ChartCard>

      <SummaryBox tone="info" eyebrow="How to read this">
        On the landscape chart, dips are good — they are stable attractors. On the hysteresis chart, the gap between
        the blue (increasing pressure) and red (decreasing pressure) curves at a given h tells you how much path
        dependence there is. A wide loop means the new state is durable; a narrow loop means impact will decay quickly
        once the field is removed.
      </SummaryBox>
    </>
  );
}
