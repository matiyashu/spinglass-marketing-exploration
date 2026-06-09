"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { ChartFaq } from "@/components/chart-faq";
import { MethodStatusBar } from "@/components/method-status-bar";
import { RegimeLine, type RegimeBand } from "@/components/charts/regime-line";
import { useMarketingContext, useDimLabel } from "@/lib/context";
import { useWorkspace } from "@/lib/workspace";
import { useAsync } from "@/lib/use-async";
import { fetchRolling } from "@/lib/marketing";

const FAQ = [
  { q: "What does each window measure?", a: <p>Each point pools six consecutive monthly tracker waves and computes the coupling summary: average signed coupling, |corr| Ising benchmark, MI, leading eigenvalue, and tension share. Stepped one month at a time.</p> },
  { q: "How do I read a regime shift?", a: <p>When synchronisation and the leading eigenvalue rise together while the tension share falls, the brand's associations are collapsing into one aligned state — often during a heavy campaign window (shaded).</p> },
];

export default function RollingRegimePage() {
  const [ws] = useWorkspace();
  const { context, dimensions } = useMarketingContext();
  const dimLabel = useDimLabel();
  const { data, loading } = useAsync(() => fetchRolling(ws, context), [ws, context.brand_id]);

  const bands: RegimeBand[] =
    (dimensions?.campaigns ?? [])
      .filter((c) => c.brand_id === context.brand_id && c.start_date && c.end_date)
      .map((c) => ({ x1: c.start_date as string, x2: c.end_date as string }));

  return (
    <>
      <PageHeader
        eyebrow="Dynamics & stability"
        title="Rolling regime"
        description={`Wave-over-wave brand-memory coherence for ${dimLabel("brands", context.brand_id)}. Shaded bands mark campaign flights.`}
      />
      <MethodStatusBar science="measured" methods={["rolling_regime"]} note={ws === "live" ? "Live compute" : "Bundled demo"} />

      <SummaryBox title="What you're looking at">
        The same rolling-window coupling summary the commodity paper benchmark uses, translated to brand-tracker
        waves. Watch the leading eigenvalue and synchronisation rise during campaign flights, then relax afterwards —
        that is the measured signature of a campaign field acting on brand memory.
      </SummaryBox>

      {loading && <p className="text-sm text-muted-foreground">Computing rolling windows…</p>}
      {data && (
        <ChartCard title="Rolling coherence indicators" subtitle="6-wave windows, stepped monthly." science="measured" footer="Tension share (dashed, right axis) is the fraction of association pairs with a negative coupling.">
          <RegimeLine records={data.records} bands={bands} />
        </ChartCard>
      )}

      <ChartFaq items={FAQ} />
    </>
  );
}
