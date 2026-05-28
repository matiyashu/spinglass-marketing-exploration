"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { ChartFaq } from "@/components/chart-faq";
import { EmptyState } from "@/components/empty-state";
import { PulseLine } from "@/components/charts/pulse-line";
import { demoLoader, type PulsePoint } from "@/lib/demo-loader";
import { useMode } from "@/lib/mode";

const FAQ = [
  {
    q: "What are the three curves?",
    a: (
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>Blue (campaign pulse)</strong> — the input. It&rsquo;s on for a window, then off. Treat this as the
          media schedule.</li>
        <li><strong>Amber (short-term buzz)</strong> — the system&rsquo;s fast response. Rises sharply, decays
          sharply.</li>
        <li><strong>Teal (long-term memory)</strong> — the slow response. Slower to climb, slower to decay, leaves a
          residue after the campaign ends.</li>
      </ul>
    ),
  },
  {
    q: "What does the time axis mean in real terms?",
    a: (
      <p>
        Each step is one MCMC sweep — an abstract time unit. When you calibrate against a real tracker you map a step
        to the cadence of your data: typically one week, or one wave. The shape of the response curves doesn&rsquo;t
        change; only the unit of t.
      </p>
    ),
  },
  {
    q: "Which curve is the 'campaign result'?",
    a: (
      <p>
        Both, depending on what you&rsquo;re trying to claim. Promo / activation lift = the amber peak. Brand / equity
        return = the residual height of the teal curve <em>after</em> the campaign window closes. Reporting only one of
        them misses half the story.
      </p>
    ),
  },
  {
    q: "What's the ratio I should watch?",
    a: (
      <p>
        Long-term residue ÷ short-term peak. A ratio near 1 means the campaign reshaped the brand&rsquo;s default state;
        a ratio near 0 means it produced a flare-up that vanished. Healthy long-running brands typically sit around
        0.4 – 0.6 on their best campaigns.
      </p>
    ),
  },
  {
    q: "Can I compare two campaigns on the same chart?",
    a: (
      <p>
        Not yet in the demo build — each pulse-response curve is a single campaign. A side-by-side overlay is on the
        roadmap. For now, capture screenshots and compare the residue heights.
      </p>
    ),
  },
];

export default function PulsePage() {
  const [mode] = useMode();
  const [points, setPoints] = useState<PulsePoint[]>([]);

  useEffect(() => {
    if (mode === "demo") demoLoader.pulse().then((p) => setPoints(p.points));
  }, [mode]);

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

      {mode === "live" ? (
        <EmptyState
          title="Pulse response simulated on your coupling matrix"
          body="A pulse response needs a time-stepped sampler driven by a finite-window field. Upload your data and start the FastAPI service to populate this view."
        />
      ) : (
        <ChartCard
          title="Pulse response"
          subtitle="Aggregate state vs time, under a finite-duration campaign pulse."
          footer="Time steps are abstract MCMC sweeps. Calibrate to your tracker cadence (weekly or wave) when interpreting."
        >
          <PulseLine points={points} />
        </ChartCard>
      )}

      <ChartFaq items={FAQ} />
    </>
  );
}
