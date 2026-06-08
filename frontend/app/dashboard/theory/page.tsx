"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ChartCard } from "@/components/chart-card";
import { ScienceBadge } from "@/components/science-badge";
import { EnergyLandscape } from "@/components/charts/energy-landscape";
import { HysteresisCurve } from "@/components/charts/hysteresis-curve";
import { PulseLine } from "@/components/charts/pulse-line";
import {
  demoLoader,
  type HysteresisPoint,
  type LandscapePoint,
  type PulsePoint,
} from "@/lib/demo-loader";

export default function TheoryPage() {
  const [landscape, setLandscape] = useState<LandscapePoint[]>([]);
  const [hysteresis, setHysteresis] = useState<HysteresisPoint[]>([]);
  const [pulse, setPulse] = useState<PulsePoint[]>([]);

  useEffect(() => {
    demoLoader.landscape().then((p) => setLandscape(p.points));
    demoLoader.hysteresis().then((p) => setHysteresis(p.points));
    demoLoader.pulse().then((p) => setPulse(p.points));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Theory · illustrative"
        title="What the spin-glass framing implies geometrically"
        description="Three shapes the model produces in closed form. Useful for intuition; not estimated from your data."
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-amber-900">These charts are illustrative, not measured.</p>
            <p className="text-amber-900/80">
              The curves below come from the analytical form of the model (tanh, Hamiltonian potential, pulse window) —
              they are drawn from declared parameters, not estimated from any uploaded data. They explain the geometry
              the spin-glass framing produces. To measure a real pulse response, hysteresis loop or energy basin on
              your data, the optional FastAPI service must be running and your tracker must contain the relevant
              longitudinal information.
            </p>
            <div className="pt-1.5">
              <ScienceBadge status="illustrative" />
            </div>
          </div>
        </div>
      </div>

      <ChartCard
        title="Energy landscape"
        subtitle="Closed-form energy E(m) = −½ J m² − h m for three field settings."
        science="illustrative"
        footer="A successful long-term campaign deepens the target-side basin so the new minimum survives after the field is removed."
      >
        <EnergyLandscape points={landscape} />
      </ChartCard>

      <ChartCard
        title="Hysteresis loop"
        subtitle="Aggregate brand state M vs marketing field h, swept up then back down (mean-field tanh approximation)."
        science="illustrative"
        footer="A wide loop means the brand is sticky — once you flip it, lower spend holds it. A narrow loop means impact decays quickly."
      >
        <HysteresisCurve points={hysteresis} />
      </ChartCard>

      <ChartCard
        title="Pulse response"
        subtitle="Closed-form short-term vs long-term response to a finite campaign window."
        science="illustrative"
        footer="Time steps are abstract. Calibrate to your tracker cadence (weekly or wave) when interpreting on real data."
      >
        <PulseLine points={pulse} />
      </ChartCard>
    </>
  );
}
