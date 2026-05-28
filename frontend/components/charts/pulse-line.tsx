"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PulsePoint } from "@/lib/demo-loader";

interface PulseLineProps {
  points: PulsePoint[];
}

export function PulseLine({ points }: PulseLineProps) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="t" tick={{ fontSize: 12, fill: "#475569" }} label={{ value: "time step", position: "insideBottom", offset: -2, fontSize: 11, fill: "#64748b" }} />
        <YAxis tick={{ fontSize: 12, fill: "#475569" }} domain={[0, 1]} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(3)} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line dataKey="campaign" name="Campaign pulse" stroke="#60a5fa" strokeWidth={2} dot={false} />
        <Line dataKey="shortterm" name="Short-term buzz" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line dataKey="longterm" name="Long-term memory" stroke="#14b8a6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
