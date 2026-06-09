"use client";

import { Printer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { KpiTile } from "@/components/kpi-tile";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useWorkspace } from "@/lib/workspace";
import { useAsync } from "@/lib/use-async";
import { fetchCouplings, marketingLoader } from "@/lib/marketing";
import { FEATURE_LABEL } from "@/lib/features";
import { contextTrail } from "@/components/context-selector";

export default function ExecutiveReportPage() {
  const [ws] = useWorkspace();
  const { context, dimensions } = useMarketingContext();
  const dimLabel = useDimLabel();
  const coupling = useAsync(() => fetchCouplings(ws, context), [ws, context.brand_id, context.segment]);
  const leakage = useAsync(() => marketingLoader.leakage(context.brand_id), [context.brand_id]);
  const s = coupling.data?.summary;
  const trail = contextTrail(dimensions, context);
  const avgLeak = leakage.data?.series.length ? leakage.data.series.reduce((a, x) => a + x.competitor_overlap, 0) / leakage.data.series.length : null;

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Executive report"
        description="A one-screen summary of the selected context — print or export to PDF."
        actions={
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted">
            <Printer className="h-4 w-4" /> Print
          </button>
        }
      />

      <div className="rounded-xl border bg-card p-2 text-xs text-muted-foreground">{trail.join("  ›  ")}</div>

      <SummaryBox title={`Brand memory summary — ${dimLabel("brands", context.brand_id)}`}>
        This report covers only the selected context. It is a diagnostic snapshot of brand-memory structure plus a
        simulated campaign outlook — not a forecast of sales.
      </SummaryBox>

      {s && (
        <section className="grid gap-3 md:grid-cols-4">
          <KpiTile label="Memory synchronization" value={s.largest_eigenvalue_signed.toFixed(2)} unit="λ_max" highlight />
          <KpiTile label="Association coherence" value={s.avg_signed_coupling.toFixed(3)} />
          <KpiTile label="Meaning diversity" value={(s.negative_edge_share * 100).toFixed(0) + "%"} />
          <KpiTile label="Competitor leakage" value={avgLeak != null ? avgLeak.toFixed(3) : "—"} />
        </section>
      )}

      {coupling.data && (
        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">What the brand owns</p>
            <ul className="mt-2 space-y-1 text-sm">
              {coupling.data.top.reinforcing.slice(0, 4).map((e, i) => (
                <li key={i}>{FEATURE_LABEL[e.a]} ↔ {FEATURE_LABEL[e.b]} <span className="text-emerald-700">(+{e.j.toFixed(2)})</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Tensions to resolve</p>
            <ul className="mt-2 space-y-1 text-sm">
              {coupling.data.top.conflicting.slice(0, 4).map((e, i) => (
                <li key={i}>{FEATURE_LABEL[e.a]} ✗ {FEATURE_LABEL[e.b]} <span className="text-red-700">({e.j.toFixed(2)})</span></li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Generated for {trail.join(" / ")} · {ws === "live" ? "live compute" : "demo data"} · couplings are measured,
        any campaign outlook is simulation.
      </p>
    </>
  );
}
