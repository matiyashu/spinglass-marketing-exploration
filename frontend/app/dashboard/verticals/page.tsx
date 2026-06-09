"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { MethodStatusBar } from "@/components/method-status-bar";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader, type VerticalsPayload } from "@/lib/marketing";

type Product = VerticalsPayload["per_product"][number];

export default function VerticalOverviewPage() {
  const { context, setContext } = useMarketingContext();
  const dimLabel = useDimLabel();
  const { data, loading } = useAsync(() => marketingLoader.verticals(context.brand_id), [context.brand_id]);

  const byVertical = new Map<string, Product[]>();
  (data?.per_product ?? []).forEach((p) => {
    const arr = byVertical.get(p.vertical_id) ?? [];
    arr.push(p);
    byVertical.set(p.vertical_id, arr);
  });

  return (
    <>
      <PageHeader
        eyebrow="Product / vertical"
        title="Vertical overview"
        description={`Memory coherence of each product in ${dimLabel("brands", context.brand_id)}, grouped by vertical.`}
      />
      <MethodStatusBar science="measured" methods={["product_comparison"]} />

      <SummaryBox title="What you're looking at">
        Each product carries its own slice of brand memory. A product whose coherence and rigidity diverge from its
        siblings is either a distinctive sub-brand or a dilution risk. Click a product to focus every screen on it.
      </SummaryBox>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {[...byVertical.entries()].map(([vertical, products]) => (
        <section key={vertical} className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">{dimLabel("verticals", vertical)}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {products.map((p) => (
              <button
                key={p.product_id}
                onClick={() => setContext({ product_id: p.product_id, vertical_id: p.vertical_id })}
                className={`rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 ${context.product_id === p.product_id ? "border-primary/40 bg-primary/5" : ""}`}
              >
                <p className="text-sm font-semibold">{p.label}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.price_tier}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  λ_max {p.largest_eigenvalue_signed.toFixed(2)} · rigidity {p.rigidity_proxy.toFixed(2)} · leakage {p.competitor_overlap.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
