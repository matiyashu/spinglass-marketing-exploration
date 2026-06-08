"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { ChartFaq } from "@/components/chart-faq";
import { EmptyState } from "@/components/empty-state";
import { EnergyLandscape } from "@/components/charts/energy-landscape";
import { HysteresisCurve } from "@/components/charts/hysteresis-curve";
import { demoLoader, type HysteresisPoint, type LandscapePoint } from "@/lib/demo-loader";
import { useMode } from "@/lib/mode";

const LANDSCAPE_FAQ = [
  {
    q: "What does the y-axis (energy) actually mean?",
    a: (
      <p>
        Energy in the Hamiltonian E(s) = −½ Σ J<sub>ij</sub> s<sub>i</sub> s<sub>j</sub> − Σ h<sub>i</sub> s<sub>i</sub>.
        Lower is more stable. You&rsquo;ll never see exact numbers in product decisions — the shape of the curve (where
        the dips are) is what carries the signal.
      </p>
    ),
  },
  {
    q: "What are the dips telling me?",
    a: (
      <p>
        Each dip is a local energy minimum — a stable brand state. A landscape with one deep dip on the target side
        means the system reliably settles into the intended meaning. A landscape with two dips (bistable) means small
        perturbations can flip the brand between two stable states.
      </p>
    ),
  },
  {
    q: "Why does the campaign curve sit lower on the right?",
    a: (
      <p>
        The campaign field h tilts the whole landscape — it&rsquo;s a linear term in s, so it acts like raising one
        side and lowering the other. The tilt is temporary; once the field is removed the original shape returns
        unless the coupling matrix itself was reshaped (the memory curve).
      </p>
    ),
  },
  {
    q: "What does the 'after memory reinforcement' curve mean for a campaign?",
    a: (
      <p>
        Durable change. The teal curve has a deeper target-side basin that survives <em>after</em> the field is removed.
        That&rsquo;s the difference between a campaign that moved the meter for a quarter and one that durably reshaped
        memory.
      </p>
    ),
  },
];

const HYSTERESIS_FAQ = [
  {
    q: "Why are there two curves?",
    a: (
      <p>
        One sweeps pressure h from very negative to very positive; the other reverses. At any intermediate h there can
        be two stable states (one for each direction of approach). The gap between the curves is the hysteresis loop.
      </p>
    ),
  },
  {
    q: "What does loop width tell me about my brand?",
    a: (
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>Wide loop</strong> = high stickiness. Once you flip the brand into a new state, lower spend keeps
          it there. Great for incumbents.</li>
        <li><strong>Narrow loop</strong> = the brand is fluid. Movements decay quickly without continuous pressure.
          Common for fashion-driven or hype-driven categories.</li>
      </ul>
    ),
  },
  {
    q: "Where on the curve am I right now?",
    a: (
      <p>
        Read M off the y-axis at your current h. If M is near the upper curve, you arrived from the target side (good
        if you want the target state). If you&rsquo;re near the lower curve, you arrived from the competitor side and
        the brand is sitting on the wrong attractor.
      </p>
    ),
  },
  {
    q: "If a campaign worked, can I cut spend and stay there?",
    a: (
      <p>
        Sometimes. The widest part of the loop is the budget you can pull <em>down</em> to without sliding back. Cut too
        far and you fall off the upper branch onto the lower one — at which point you need a fresh push to climb back.
      </p>
    ),
  },
];

export default function LandscapePage() {
  const [mode] = useMode();
  const [landscape, setLandscape] = useState<LandscapePoint[]>([]);
  const [hysteresis, setHysteresis] = useState<HysteresisPoint[]>([]);

  useEffect(() => {
    if (mode !== "demo-brand") return;
    demoLoader.landscape().then((p) => setLandscape(p.points));
    demoLoader.hysteresis().then((p) => setHysteresis(p.points));
  }, [mode]);

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

      {mode !== "demo-brand" ? (
        <EmptyState expects="brand" mode={mode} />
      ) : (
        <>
          <ChartCard
            title="Energy landscape"
            subtitle="Baseline → during campaign field → after memory reinforcement."
            science="illustrative"
            footer="A successful long-term campaign deepens the target-side basin so the new minimum survives after the field is removed."
          >
            <EnergyLandscape points={landscape} />
          </ChartCard>

          <ChartFaq title="How to read the landscape" items={LANDSCAPE_FAQ} />

          <ChartCard
            title="Hysteresis loop"
            subtitle="Aggregate brand state M vs marketing field h, swept up then back down."
            science="illustrative"
            footer="The width between the two curves is the 'stickiness' budget: once flipped, the state holds at lower maintenance spend."
          >
            <HysteresisCurve points={hysteresis} />
          </ChartCard>

          <ChartFaq title="How to read the hysteresis loop" items={HYSTERESIS_FAQ} />
        </>
      )}
    </>
  );
}
