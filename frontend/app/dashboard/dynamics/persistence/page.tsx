"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { MethodStatusBar } from "@/components/method-status-bar";
import { useMarketingContext } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";

interface Row { id: string; pre: number; during: number; post: number; residue: number }

export default function PersistencePage() {
  const { context, dimensions } = useMarketingContext();
  const campaigns = (dimensions?.campaigns ?? []).filter((c) => c.brand_id === context.brand_id);

  const { data } = useAsync(async () => {
    const payloads = await Promise.all(campaigns.map((c) => marketingLoader.campaign(c.id)));
    return payloads.map((p): Row | null => {
      const { pre, during, post } = p.phase_overlap;
      if (pre == null || during == null || post == null) return null;
      const lift = during - pre;
      const residue = Math.abs(lift) < 1e-6 ? 0 : (post - pre) / lift;
      return { id: p.campaign.id as string, pre, during, post, residue };
    }).filter(Boolean) as Row[];
  }, [context.brand_id, campaigns.length]);

  return (
    <>
      <PageHeader
        eyebrow="Dynamics & stability"
        title="Memory persistence"
        description="How much of each campaign's memory lift survived after the flight ended."
      />
      <MethodStatusBar science="measured" methods={["observed_response"]} note="from longitudinal tracker waves" />

      <SummaryBox title="What you're looking at">
        Persistence is the residue ratio (post − pre) / (during − pre): how much of the in-flight lift remained once
        the campaign field switched off. Near 1 means durable memory; near 0 means buzz that decayed. This is measured
        from the post-campaign tracker waves, not assumed.
      </SummaryBox>

      {data && (
        <ChartCard title="Post-campaign residue by campaign" subtitle="pre → during → post target overlap, and the surviving share." science="measured">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2">Campaign</th><th>Pre</th><th>During</th><th>Post</th><th>Residue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 font-medium">{r.id}</td>
                    <td className="font-mono">{r.pre.toFixed(3)}</td>
                    <td className="font-mono">{r.during.toFixed(3)}</td>
                    <td className="font-mono">{r.post.toFixed(3)}</td>
                    <td className="font-mono">
                      <span className={r.residue > 0.4 ? "text-emerald-700" : r.residue > 0 ? "text-amber-600" : "text-red-700"}>
                        {(r.residue * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </>
  );
}
