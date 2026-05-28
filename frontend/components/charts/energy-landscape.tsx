"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LandscapePoint } from "@/lib/demo-loader";

interface EnergyLandscapeProps {
  points: LandscapePoint[];
}

export function EnergyLandscape({ points }: EnergyLandscapeProps) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="m"
          type="number"
          domain={[-1, 1]}
          tick={{ fontSize: 12, fill: "#475569" }}
          label={{ value: "brand state (competitor ← → target)", position: "insideBottom", offset: -2, fontSize: 11, fill: "#64748b" }}
        />
        <YAxis tick={{ fontSize: 12, fill: "#475569" }} label={{ value: "energy", angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(3)} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line dataKey="baseline" name="Baseline landscape" stroke="#94a3b8" strokeWidth={2} dot={false} />
        <Line dataKey="campaign" name="During campaign field" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line dataKey="memory" name="After memory reinforcement" stroke="#14b8a6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
