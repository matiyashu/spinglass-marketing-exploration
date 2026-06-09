"use client";

import Link from "next/link";
import { ArrowRight, Network, Radio, Split, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { KpiTile } from "@/components/kpi-tile";
import { MethodStatusBar } from "@/components/method-status-bar";
import { DataSufficiencyBadge } from "@/components/data-sufficiency-badge";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useWorkspace } from "@/lib/workspace";
import { useAsync } from "@/lib/use-async";
import { fetchCouplings, fetchMethodStatus, marketingLoader } from "@/lib/marketing";

const SHORTCUTS = [
  { href: "/dashboard/brands/memory-map", icon: Network, title: "Brand memory map", body: "The coupling structure between associations for the selected context." },
  { href: "/dashboard/brands/tensions", icon: Split, title: "Brand tensions", body: "Conflicting associations and frustrated triads that pull meaning apart." },
  { href: "/dashboard/verticals/segment-differences", icon: Users, title: "Segment differences", body: "Where audiences encode the brand differently." },
  { href: "/dashboard/campaigns", icon: Radio, title: "Campaigns", body: "Creative memory patterns, field response and observed validation." },
];

export default function HomePage() {
  const [ws] = useWorkspace();
  const { context } = useMarketingContext();
  const dimLabel = useDimLabel();
  const coupling = useAsync(() => fetchCouplings(ws, context), [ws, context.brand_id, context.segment]);
  const methods = useAsync(() => fetchMethodStatus(ws), [ws]);
  const portfolio = useAsync(() => marketingLoader.portfolio(), []);

  const s = coupling.data?.summary;
  const brandLabel = dimLabel("brands", context.brand_id);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title={`${brandLabel} — brand memory workspace`}
        description="Every screen inherits the brand / product / market / segment / campaign selected above. Start here, then drill into memory structure, tensions, segments and campaigns."
      />

      <MethodStatusBar science="measured" methods={["brand_couplings", "rolling_regime"]} note={ws === "live" ? "Live compute" : "Bundled demo"} />

      <SummaryBox title="What this workbench does">
        It treats the {coupling.data?.features.length ?? 10} brand-tracker associations as spins in a spin-glass and
        estimates their coupling matrix from respondent co-movement. Reinforcing associations have positive couplings;
        tensions are negative. The four questions every screen answers: <strong>what the brand means</strong>,{" "}
        <strong>where meaning is coherent or contradictory</strong>, <strong>which product / segment / campaign is
        shifting it</strong>, and <strong>whether the shift is durable</strong>.
      </SummaryBox>

      {s && (
        <section className="grid gap-3 md:grid-cols-4">
          <KpiTile label="Memory synchronization" value={s.largest_eigenvalue_signed.toFixed(2)} unit="λ_max" hint="Leading eigenvalue of the signed coupling matrix" highlight />
          <KpiTile label="Association coherence" value={s.avg_signed_coupling.toFixed(3)} hint="Mean signed coupling across association pairs" />
          <KpiTile label="Meaning diversity" value={(s.negative_edge_share * 100).toFixed(0) + "%"} hint="Share of association pairs in tension (negative)" />
          <KpiTile label="Memory rigidity" value={(coupling.data?.rigidity_proxy ?? 0).toFixed(2)} unit="proxy" hint="(1/N)Σ⟨sᵢ⟩² — a proxy, not the EA order parameter" />
        </section>
      )}

      {portfolio.data && (
        <section className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portfolio coherence</p>
          <div className="mt-3 space-y-2">
            {portfolio.data.brands.map((b) => (
              <div key={b.brand_id} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 font-medium">{dimLabel("brands", b.brand_id)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, b.largest_eigenvalue_signed / 2 * 100)}%` }} />
                </div>
                <span className="w-32 shrink-0 text-right text-xs text-muted-foreground">λ_max {b.largest_eigenvalue_signed.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {methods.data && (
        <section className="flex flex-wrap gap-2">
          {methods.data.methods.map((m) => (
            <DataSufficiencyBadge key={m.method} enabled={m.enabled} label={m.label} missing={m.missing} />
          ))}
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-2">
        {SHORTCUTS.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} className="group flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5">
              <div className="flex items-center gap-2 text-primary">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-semibold text-foreground">{c.title}</span>
              </div>
              <p className="text-sm text-muted-foreground">{c.body}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          );
        })}
      </section>
    </>
  );
}
