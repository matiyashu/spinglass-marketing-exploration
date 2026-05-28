"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { ChartFaq } from "@/components/chart-faq";
import { EmptyState } from "@/components/empty-state";
import { ScenarioBars } from "@/components/charts/scenario-bars";
import { demoLoader, type ScenarioRow } from "@/lib/demo-loader";
import { formatNumber } from "@/lib/utils";
import { useMode } from "@/lib/mode";

const LABELS: Record<string, string> = {
  baseline: "Baseline",
  moderate_campaign: "Moderate campaign",
  heavy_campaign: "Heavy campaign",
};

const FAQ = [
  {
    q: "What does 'spend' mean here?",
    a: (
      <p>
        It&rsquo;s a scalar multiplier on the external field h pushing toward the target memory. 0 = no campaign field,
        ~0.22 = moderate push, ~0.45 = heavy. The number is an abstract intensity, not a currency amount; calibration
        to a media budget is a downstream step.
      </p>
    ),
  },
  {
    q: "What's a strong target-overlap response?",
    a: (
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>+0.5 → +0.7</strong> at moderate spend = healthy retrieval; the pattern is taking hold.</li>
        <li><strong>+0.6 → +0.8</strong> at heavy spend = the campaign locked the brand into the intended state.</li>
        <li><strong>&lt; +0.3 at heavy spend</strong> = the creative isn&rsquo;t cueing the target pattern; rework the
          message before doubling spend.</li>
      </ul>
    ),
  },
  {
    q: "Why is the purchase probability a logit?",
    a: (
      <p>
        It&rsquo;s a transparent downstream layer combining overlap, mean consideration, competitor overlap and
        frustration into a probability between 0 and 1. The coefficients in this demo are fitted on synthetic data — in
        a real deployment you&rsquo;d refit them against conversion or sales-lift outcomes.
      </p>
    ),
  },
  {
    q: "Why does frustration fall as spend rises?",
    a: (
      <p>
        Stronger external fields force the system into a less ambiguous state — fewer signed couplings remain
        unsatisfied because the field is overpowering them. Practically: the brand starts to mean one consistent thing
        rather than several contradictory things at once.
      </p>
    ),
  },
  {
    q: "Should I just maximise heavy_campaign?",
    a: (
      <p>
        No — heavier spend has diminishing returns and costs money. The interesting question is the slope between
        baseline and moderate. A steep slope means your creative is doing the work; a flat slope means more pressure
        won&rsquo;t fix a positioning problem.
      </p>
    ),
  },
];

export default function ScenariosPage() {
  const [mode] = useMode();
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);

  useEffect(() => {
    if (mode === "demo") demoLoader.scenarios().then((p) => setScenarios(p.scenarios));
  }, [mode]);

  return (
    <>
      <PageHeader
        eyebrow="Analysis"
        title="Scenarios"
        description="Three campaign-pressure levels sampled at equilibrium, with the downstream purchase-probability layer applied."
      />

      <SummaryBox title="What you're looking at">
        Each row is one scenario: a baseline or campaign-spend setting. The kernel runs a Glauber sampler against the
        post-campaign coupling matrix and reports the equilibrium overlap with the target and competitor memory
        patterns, plus mean consideration and a logit-derived purchase probability. As spend rises, target overlap
        climbs, competitor overlap falls, and frustration drops.
      </SummaryBox>

      {mode === "live" ? (
        <EmptyState
          title="Scenario simulation needs your data + the backend"
          body="The Glauber sampler runs in Python. Upload your CSV, then start the FastAPI service so the dashboard can simulate baseline / moderate / heavy campaigns against your couplings."
        />
      ) : (
        <>
          <ChartCard
            title="Scenario metrics"
            subtitle="Target overlap, purchase probability, and frustration across three campaign pressure levels."
          >
            <ScenarioBars scenarios={scenarios} />
          </ChartCard>

          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Scenario</th>
                  <th className="px-4 py-3 font-semibold">Spend</th>
                  <th className="px-4 py-3 font-semibold">Target overlap</th>
                  <th className="px-4 py-3 font-semibold">Competitor overlap</th>
                  <th className="px-4 py-3 font-semibold">Mean consideration</th>
                  <th className="px-4 py-3 font-semibold">Purchase prob.</th>
                  <th className="px-4 py-3 font-semibold">Frustration</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scenarios.map((s) => (
                  <tr key={s.name}>
                    <td className="px-4 py-3 font-medium">{LABELS[s.name] ?? s.name}</td>
                    <td className="px-4 py-3 font-mono">{formatNumber(s.spend, 2)}</td>
                    <td className="px-4 py-3 font-mono">{formatNumber(s.target_overlap)}</td>
                    <td className="px-4 py-3 font-mono">{formatNumber(s.competitor_overlap)}</td>
                    <td className="px-4 py-3 font-mono">{formatNumber(s.mean_consideration)}</td>
                    <td className="px-4 py-3 font-mono">{formatNumber(s.purchase_probability)}</td>
                    <td className="px-4 py-3 font-mono">{formatNumber(s.frustration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SummaryBox tone="info" eyebrow="How to read this">
        Target overlap and purchase probability move together; frustration declines as the brand&rsquo;s meaning
        consolidates. The purchase-probability column is a logit of overlap + consideration − competitor overlap −
        frustration, calibrated on synthetic data. Treat it as a directional signal, not a forecast.
      </SummaryBox>

      <ChartFaq items={FAQ} />
    </>
  );
}
