"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { MethodStatusBar } from "@/components/method-status-bar";
import { CampaignRequired } from "@/components/campaign-required";
import { ScienceBadge } from "@/components/science-badge";
import { useMarketingContext } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";

export default function SimulatorPage() {
  const { context } = useMarketingContext();
  const cid = context.campaign_id;
  const { data } = useAsync(() => (cid ? marketingLoader.campaign(cid) : Promise.resolve(null)), [cid]);

  const rows = (data?.simulation ?? []).map((s) => ({
    spend: `${(s.spend * 100).toFixed(0)}%`,
    target: s.target_overlap,
    competitor: s.competitor_overlap,
    frustration: s.frustration,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title="Scenario simulator"
        description="Simulated target-memory retrieval at increasing campaign spend, from the declared creative pattern."
        actions={<ScienceBadge status="simulation" inline />}
      />
      <MethodStatusBar science="simulation" methods={["campaign_field"]} note="declared parameters — not a forecast" />

      {!cid && <CampaignRequired />}

      {data && (
        <>
          <SummaryBox title="What you're looking at" tone="info">
            <strong>Simulation from declared parameters, not empirical proof.</strong> We add the creative pattern as a
            Hopfield memory term, raise the external field with spend, and sample the equilibrium. Target overlap should
            rise and frustration fall as the field strengthens. There is deliberately <em>no</em> purchase-probability
            card — that requires a fitted, validated outcome model.
          </SummaryBox>

          <ChartCard title="Simulated retrieval vs spend" subtitle="Target overlap, competitor overlap and frustration at each spend level." science="simulation">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="spend" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(3)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="target" name="target overlap" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="competitor" name="competitor overlap" fill="#f87171" radius={[3, 3, 0, 0]} />
                <Bar dataKey="frustration" name="frustration" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </>
  );
}
