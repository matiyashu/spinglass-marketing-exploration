"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ScenarioRow } from "@/lib/demo-loader";

interface ScenarioBarsProps {
  scenarios: ScenarioRow[];
}

const LABELS: Record<string, string> = {
  baseline: "Baseline",
  moderate_campaign: "Moderate campaign",
  heavy_campaign: "Heavy campaign",
};

export function ScenarioBars({ scenarios }: ScenarioBarsProps) {
  const data = scenarios.map((s) => ({
    scenario: LABELS[s.name] ?? s.name,
    target_overlap: s.target_overlap,
    purchase_probability: s.purchase_probability,
    frustration: s.frustration,
  }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="scenario" tick={{ fontSize: 12, fill: "#475569" }} />
        <YAxis tick={{ fontSize: 12, fill: "#475569" }} domain={[-0.4, 1]} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          formatter={(v: number) => v.toFixed(3)}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="target_overlap" name="Target overlap" fill="#14b8a6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="purchase_probability" name="Purchase prob." fill="#60a5fa" radius={[4, 4, 0, 0]} />
        <Bar dataKey="frustration" name="Frustration" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
