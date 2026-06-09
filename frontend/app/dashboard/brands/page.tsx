"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { MethodStatusBar } from "@/components/method-status-bar";
import { KpiTile } from "@/components/kpi-tile";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useAsync } from "@/lib/use-async";
import { marketingLoader } from "@/lib/marketing";

export default function PortfolioPage() {
  const { context, setContext } = useMarketingContext();
  const dimLabel = useDimLabel();
  const { data } = useAsync(() => marketingLoader.portfolio(), []);
  const brands = data?.brands ?? [];
  const maxEig = Math.max(1, ...brands.map((b) => b.largest_eigenvalue_signed));

  return (
    <>
      <PageHeader
        eyebrow="Brand portfolio"
        title="Portfolio overview"
        description="Memory coherence, rigidity and meaning-diversity compared across the brands in the workspace."
      />
      <MethodStatusBar science="measured" methods={["brand_couplings", "replica_estimation"]} />

      <SummaryBox title="What you're looking at">
        A coherent brand has a high leading eigenvalue (associations move together) and meaningful — not collapsed —
        meaning diversity. Rigidity (a proxy) measures how polarized association means are. Click a brand to make it
        the active context for every other screen.
      </SummaryBox>

      <section className="grid gap-3 md:grid-cols-3">
        {brands.map((b) => (
          <button
            key={b.brand_id}
            onClick={() => setContext({ brand_id: b.brand_id })}
            className={`rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 ${context.brand_id === b.brand_id ? "border-primary/40 bg-primary/5" : ""}`}
          >
            <p className="text-sm font-semibold">{dimLabel("brands", b.brand_id)}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(b.largest_eigenvalue_signed / maxEig) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">λ_max {b.largest_eigenvalue_signed.toFixed(2)} · rigidity {b.rigidity_proxy.toFixed(2)} · tension {(b.negative_edge_share * 100).toFixed(0)}%</p>
          </button>
        ))}
      </section>

      {(() => {
        const sel = brands.find((b) => b.brand_id === context.brand_id);
        if (!sel) return null;
        return (
          <section className="grid gap-3 md:grid-cols-4">
            <KpiTile label="Memory synchronization" value={sel.largest_eigenvalue_signed.toFixed(2)} unit="λ_max" highlight />
            <KpiTile label="Association coherence" value={sel.avg_signed_coupling.toFixed(3)} />
            <KpiTile label="Meaning diversity" value={(sel.negative_edge_share * 100).toFixed(0) + "%"} />
            <KpiTile label="Memory rigidity" value={sel.rigidity_proxy.toFixed(2)} unit="proxy" />
          </section>
        );
      })()}

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { href: "/dashboard/brands/memory-map", label: "Memory map", body: "The full coupling structure." },
          { href: "/dashboard/brands/tensions", label: "Tensions", body: "Conflicting edges and frustrated triads." },
          { href: "/dashboard/brands/competitive-leakage", label: "Competitive leakage", body: "Overlap with competitor memory over time." },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5">
            <span className="text-sm font-semibold">{c.label}</span>
            <span className="text-xs text-muted-foreground">{c.body}</span>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">Open <ArrowRight className="h-3 w-3" /></span>
          </Link>
        ))}
      </section>
    </>
  );
}
