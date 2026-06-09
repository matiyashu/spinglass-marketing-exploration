"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { MethodStatusBar } from "@/components/method-status-bar";
import { KpiTile } from "@/components/kpi-tile";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";

export default function CompetitiveLeakagePage() {
  const { context } = useMarketingContext();
  const dimLabel = useDimLabel();
  const { data, loading } = useAsync(() => marketingLoader.leakage(context.brand_id), [context.brand_id]);
  const series = (data?.series ?? []).map((s) => ({ date: s.date.slice(0, 7), overlap: s.competitor_overlap, leak: s.leak_share }));
  const avg = series.length ? series.reduce((a, s) => a + s.overlap, 0) / series.length : 0;
  const peak = series.reduce((m, s) => (s.overlap > m.overlap ? s : m), { date: "—", overlap: -1, leak: 0 });

  return (
    <>
      <PageHeader
        eyebrow="Brand portfolio"
        title="Competitive leakage"
        description={`How strongly ${dimLabel("brands", context.brand_id)} memory overlaps a competitor pattern, wave over wave.`}
      />
      <MethodStatusBar science="measured" methods={["competitive_leakage"]} />

      <SummaryBox title="What you're looking at">
        Competitive leakage is the mean overlap of observed respondent states with a competitor memory pattern (high
        competitor salience, low brand linkage). Rising leakage means the category, not the brand, owns the moment.
        Treat the competitor as an opposing external field, not a coupling.
      </SummaryBox>

      <section className="grid gap-3 md:grid-cols-2">
        <KpiTile label="Average leakage" value={avg.toFixed(3)} hint="mean competitor overlap across waves" />
        <KpiTile label="Peak leakage" value={peak.overlap.toFixed(3)} hint={`wave ${peak.date}`} highlight />
      </section>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {series.length > 0 && (
        <ChartCard title="Leakage over time" subtitle="Competitor-pattern overlap per tracker wave." science="measured">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={series} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="leak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#475569" }} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(3)} />
              <Area dataKey="overlap" stroke="#ef4444" strokeWidth={2} fill="url(#leak)" name="competitor overlap" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </>
  );
}
