"use client";

import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MemoryPayload } from "@/lib/demo-loader";

interface MemoryOverlapProps {
  payload: MemoryPayload;
}

const LABELS: Record<string, string> = {
  baseline: "Baseline",
  moderate_campaign: "Moderate",
  heavy_campaign: "Heavy",
};

export function MemoryOverlap({ payload }: MemoryOverlapProps) {
  const data = payload.scenarios.map((s) => ({
    scenario: LABELS[s.name] ?? s.name,
    target: s.target_overlap,
    competitor: s.competitor_overlap,
  }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="scenario" tick={{ fontSize: 12, fill: "#475569" }} />
        <YAxis tick={{ fontSize: 12, fill: "#475569" }} domain={[-1, 1]} />
        <ReferenceLine y={0} stroke="#cbd5e1" />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(3)} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="target" name="Target memory overlap" fill="#14b8a6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="competitor" name="Competitor overlap" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
