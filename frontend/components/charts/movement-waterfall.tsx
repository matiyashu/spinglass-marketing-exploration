"use client";

import { Bar, BarChart, Cell, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FEATURE_LABEL, type Feature } from "@/lib/features";

interface Props {
  features: Feature[];
  /** Per-feature movement (e.g. during − pre mean spin). */
  values: number[];
}

/** Association-movement waterfall: which associations the campaign shifted. */
export function MovementWaterfall({ features, values }: Props) {
  const data = features
    .map((f, i) => ({ feature: FEATURE_LABEL[f], delta: values[i] }))
    .sort((a, b) => b.delta - a.delta);
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 70 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#475569" }} />
        <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: "#475569" }} width={120} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(3)} />
        <Bar dataKey="delta" radius={[0, 3, 3, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.delta >= 0 ? "#14b8a6" : "#f87171"} />
          ))}
          <LabelList dataKey="delta" position="right" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 10, fill: "#475569" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
