"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { PulseLine } from "@/components/charts/pulse-line";
import { demoLoader, type PulsePoint } from "@/lib/demo-loader";

export default function PulsePage() {
  const [points, setPoints] = useState<PulsePoint[]>([]);

  useEffect(() => {
    demoLoader.pulse().then((p) => setPoints(p.points));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Analysis"
        title="Pulse response"
        description="How short-term buzz and long-term memory react to a finite campaign window."
      />

      <SummaryBox title="What you're looking at">
        The blue trace is the campaign field — on for a window, then off. The amber curve is the short-term system
        response: rises fast, decays fast. The teal curve is the long-term memory response: slower to climb, leaves a
        residue after the field is removed. The vertical gap between them at any time step is what gets misread as
        &ldquo;campaign ROI&rdquo; if you only look at the short-term signal.
      </SummaryBox>

      <ChartCard
        title="Pulse response"
        subtitle="Aggregate state vs time, under a finite-duration campaign pulse."
        footer="Time steps are abstract MCMC sweeps. Calibrate to your tracker cadence (weekly or wave) when interpreting."
      >
        <PulseLine points={points} />
      </ChartCard>

      <SummaryBox tone="info" eyebrow="How to read this">
        A campaign that produces only the amber curve was a buzz play — it moved the meter for a few cycles and then
        disappeared. A campaign that also lifts the teal curve durably moved the brand&rsquo;s memory baseline. The
        ratio of residual long-term lift to peak short-term lift is the closest single number to &ldquo;equity
        return.&rdquo;
      </SummaryBox>
    </>
  );
}
