"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { MethodStatusBar } from "@/components/method-status-bar";
import { CircleSlash } from "lucide-react";
import { CampaignRequired } from "@/components/campaign-required";
import { useMarketingContext } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";

export default function ValidationPage() {
  const { context } = useMarketingContext();
  const cid = context.campaign_id;
  const { data } = useAsync(() => (cid ? marketingLoader.campaign(cid) : Promise.resolve(null)), [cid]);

  const outcomes = (data?.outcomes ?? []).map((o) => ({ date: o.date.slice(0, 7), brand_lift: o.brand_lift, roas: o.roas }));

  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title="Observed validation"
        description="Calibrate the campaign against observed outcomes. Enabled only when the campaign ships outcome data."
      />
      <MethodStatusBar science="measured" methods={["outcome_validation"]} note="requires outcome data" />

      {!cid && <CampaignRequired />}

      {data && !data.has_outcomes && (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed bg-card px-5 py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CircleSlash className="h-4 w-4" />
            <p className="text-sm font-semibold text-foreground">No outcome data for this campaign</p>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            Observed validation needs sales, conversion or brand-lift data joined to the campaign window. This campaign
            ships none, so outcome calibration stays disabled — by design, we never show a synthetic forecast in its
            place. Pick a campaign tagged <span className="font-medium text-foreground">outcomes</span> on the overview.
          </p>
        </div>
      )}

      {data && data.has_outcomes && (
        <>
          <SummaryBox title="What you're looking at">
            With outcome data present, we can test whether the campaign&rsquo;s memory movement tracks observed
            results. This is the validation layer — the spin-glass model diagnoses and simulates; only here, against
            real outcomes, do we make calibrated claims.
          </SummaryBox>

          <ChartCard title="Observed brand lift & ROAS" subtitle="Outcome series over the campaign window." science="measured">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={outcomes} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line yAxisId="l" dataKey="brand_lift" name="brand lift" stroke="#14b8a6" strokeWidth={2} dot={false} />
                <Line yAxisId="r" dataKey="roas" name="ROAS" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </>
  );
}
