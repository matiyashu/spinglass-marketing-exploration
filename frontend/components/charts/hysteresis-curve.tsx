"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HysteresisPoint } from "@/lib/demo-loader";

interface HysteresisCurveProps {
  points: HysteresisPoint[];
}

export function HysteresisCurve({ points }: HysteresisCurveProps) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="h"
          type="number"
          domain={[-1, 1]}
          tick={{ fontSize: 12, fill: "#475569" }}
          label={{ value: "marketing field h", position: "insideBottom", offset: -2, fontSize: 11, fill: "#64748b" }}
        />
        <YAxis tick={{ fontSize: 12, fill: "#475569" }} domain={[-1, 1]} />
        <ReferenceLine x={0} stroke="#cbd5e1" />
        <ReferenceLine y={0} stroke="#cbd5e1" />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(3)} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line dataKey="increasing" name="Increasing pressure" stroke="#60a5fa" strokeWidth={2} dot={false} />
        <Line dataKey="decreasing" name="Decreasing pressure" stroke="#f87171" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
