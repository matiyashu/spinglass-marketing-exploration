"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { ScenarioBars } from "@/components/charts/scenario-bars";
import { demoLoader, type ScenarioRow } from "@/lib/demo-loader";
import { formatNumber } from "@/lib/utils";

const LABELS: Record<string, string> = {
  baseline: "Baseline",
  moderate_campaign: "Moderate campaign",
  heavy_campaign: "Heavy campaign",
};

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);

  useEffect(() => {
    demoLoader.scenarios().then((p) => setScenarios(p.scenarios));
  }, []);

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

      <SummaryBox tone="info" eyebrow="How to read this">
        Target overlap and purchase probability move together; frustration declines as the brand&rsquo;s meaning
        consolidates. The purchase-probability column is a logit of overlap + consideration − competitor overlap −
        frustration, calibrated on synthetic data. Treat it as a directional signal, not a forecast.
      </SummaryBox>
    </>
  );
}
