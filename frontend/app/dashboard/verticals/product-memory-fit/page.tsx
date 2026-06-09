"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { MethodStatusBar } from "@/components/method-status-bar";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";

export default function ProductMemoryFitPage() {
  const { context } = useMarketingContext();
  const dimLabel = useDimLabel();
  const { data, loading } = useAsync(() => marketingLoader.verticals(context.brand_id), [context.brand_id]);

  const rows = (data?.per_product ?? []).map((p) => ({
    label: p.label,
    coherence: p.avg_signed_coupling,
    sync: p.largest_eigenvalue_signed,
    active: p.product_id === context.product_id,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Product / vertical"
        title="Product memory fit"
        description={`How consistent each product's memory is with the master brand ${dimLabel("brands", context.brand_id)}.`}
      />
      <MethodStatusBar science="measured" methods={["product_comparison"]} />

      <SummaryBox title="What you're looking at">
        Memory synchronisation (leading eigenvalue) per product. A product far below its siblings has a fragmented or
        weakly-linked memory — it is not yet carrying the master-brand structure. One far above may be a distinctive
        hero product.
      </SummaryBox>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {rows.length > 0 && (
        <ChartCard title="Memory synchronisation by product" subtitle="Leading eigenvalue of each product's coupling matrix." science="measured">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rows} margin={{ top: 8, right: 24, bottom: 4, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#475569" }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => v.toFixed(2)} />
              <Bar dataKey="sync" radius={[3, 3, 0, 0]}>
                {rows.map((r, i) => (
                  <Cell key={i} fill={r.active ? "#0d9488" : "#5eead4"} />
                ))}
                <LabelList dataKey="sync" position="top" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 10, fill: "#475569" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </>
  );
}
