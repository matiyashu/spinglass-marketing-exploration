"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RollingMetric } from "@/lib/commodity";

interface RollingMetricsLineProps {
  records: RollingMetric[];
}

export function RollingMetricsLine({ records }: RollingMetricsLineProps) {
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
        <ReferenceArea x1="2020-02" x2="2020-06" fill="#fecaca" fillOpacity={0.25} />
        <ReferenceArea x1="2022-01" x2="2022-06" fill="#fed7aa" fillOpacity={0.25} />
        <XAxis dataKey="window" tick={{ fontSize: 11, fill: "#475569" }} interval={4} />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#475569" }} domain={[0, "auto"]} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#475569" }} domain={[0, 0.5]} hide />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(3)} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
        <Line yAxisId="left" dataKey="avg_signed" name="avg signed corr" stroke="#14b8a6" strokeWidth={2} dot={false} />
        <Line yAxisId="left" dataKey="avg_ising" name="avg |corr| (Ising)" stroke="#60a5fa" strokeWidth={2} dot={false} />
        <Line yAxisId="left" dataKey="avg_mi" name="avg MI" stroke="#a855f7" strokeWidth={2} dot={false} />
        <Line yAxisId="left" dataKey="eig_signed" name="largest eigenvalue" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line yAxisId="right" dataKey="neg_share" name="negative-edge share" stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
