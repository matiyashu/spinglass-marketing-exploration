"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RollingRecord } from "@/lib/marketing";

export interface RegimeBand {
  x1: string;
  x2: string;
  fill?: string;
}

interface Props {
  records: RollingRecord[];
  bands?: RegimeBand[];
}

/** Rolling brand-memory coherence over tracker waves. Optional campaign bands. */
export function RegimeLine({ records, bands = [] }: Props) {
  const data = records.map((r) => ({
    window: r.window_start.slice(0, 7),
    avg_signed: r.avg_signed_coupling,
    avg_ising: r.avg_abs_coupling_ising,
    avg_mi: r.avg_mutual_information,
    eig_signed: r.largest_eigenvalue_signed,
    neg_share: r.negative_edge_share,
  }));
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        {bands.map((b, i) => (
          <ReferenceArea key={i} x1={b.x1.slice(0, 7)} x2={b.x2.slice(0, 7)} fill={b.fill ?? "#5eead4"} fillOpacity={0.18} />
        ))}
        <XAxis dataKey="window" tick={{ fontSize: 11, fill: "#475569" }} interval={2} />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#475569" }} domain={["auto", "auto"]} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 0.6]} hide />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(3)} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
        <Line yAxisId="left" dataKey="avg_signed" name="avg signed coupling" stroke="#14b8a6" strokeWidth={2} dot={false} />
        <Line yAxisId="left" dataKey="avg_ising" name="avg |corr| (Ising)" stroke="#60a5fa" strokeWidth={2} dot={false} />
        <Line yAxisId="left" dataKey="avg_mi" name="avg MI" stroke="#a855f7" strokeWidth={2} dot={false} />
        <Line yAxisId="left" dataKey="eig_signed" name="largest eigenvalue" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line yAxisId="right" dataKey="neg_share" name="tension share" stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
