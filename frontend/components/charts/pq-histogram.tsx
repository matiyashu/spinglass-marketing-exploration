"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PQ } from "@/lib/marketing";

interface Props {
  pq: PQ;
  color?: string;
}

/** Overlap distribution P(q). Narrow+near-1 = one state; broad/multimodal = competing states. */
export function PqHistogram({ pq, color = "#14b8a6" }: Props) {
  const data = pq.q.map((q, i) => ({ q: q.toFixed(2), pq: pq.pq[i] }));
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="q" tick={{ fontSize: 10, fill: "#475569" }} interval={3} />
          <YAxis tick={{ fontSize: 10, fill: "#475569" }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(3)} labelFormatter={(l) => `q = ${l}`} />
          <Bar dataKey="pq" fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[11px] text-muted-foreground">mean q = {pq.mean.toFixed(3)} · spread = {pq.std.toFixed(3)}</p>
    </div>
  );
}
