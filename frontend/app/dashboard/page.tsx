import Link from "next/link";
import { ArrowRight, ClipboardList, HelpCircle, Network, Sparkles, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { KpiTile } from "@/components/kpi-tile";

const SURFACES = [
  {
    href: "/dashboard/data-requirements",
    icon: ClipboardList,
    title: "Data requirements",
    body: "What shape your CSV needs to be — 10 binary or Likert columns, ≥ 50 rows, no zero-variance columns.",
  },
  {
    href: "/dashboard/upload",
    icon: Upload,
    title: "Upload & validate",
    body: "Drop a CSV. Validation runs entirely in your browser and reports missing columns, zero variance, class imbalance.",
  },
  {
    href: "/dashboard/couplings",
    icon: Network,
    title: "Couplings heatmap",
    body: "Signed (spin-glass), absolute (Ising), and mutual-information views of how brand associations move together.",
  },
  {
    href: "/dashboard/memory",
    icon: Sparkles,
    title: "Memory & campaign",
    body: "Target vs competitor pattern overlap across baseline, moderate and heavy campaign pressure.",
  },
  {
    href: "/dashboard/faq",
    icon: HelpCircle,
    title: "FAQ",
    body: "What is a spin-glass? What is frustration? How do I read the energy landscape?",
  },
];

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Spin-Glass Marketing Exploration"
        description="A research dashboard that treats brand memory as an energy landscape — Ising synchronization, signed spin-glass couplings, Hopfield attractors, and Glauber dynamics applied to brand tracking and campaign measurement."
      />

      <SummaryBox
        title="What this dashboard does"
        footer="All charts on the analysis tabs render from a pre-computed synthetic scenario shipped with the app. The upload + validation tabs work on your real data, fully in the browser."
      >
        Standard brand trackers report KPI deltas in isolation. The spin-glass framing forces three questions you can&rsquo;t
        answer from a KPI table: do my associations move together or fragment, does this campaign retrieve the memory I
        intend or activate the competitor&rsquo;s pattern, and will the lift survive a category shock?
      </SummaryBox>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiTile label="Features modelled" value="10" hint="Ad recall · brand link · trust · value · premium · competitor salience · …" />
        <KpiTile label="Coupling modes" value="3" hint="Spin-glass (signed), Ising (abs), mutual information" />
        <KpiTile label="Scenarios bundled" value="3" hint="Baseline → moderate → heavy campaign" highlight />
      </section>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {SURFACES.map(({ href, icon: Icon, title, body }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-center gap-2 text-primary">
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold text-foreground">{title}</span>
            </div>
            <p className="text-sm text-muted-foreground">{body}</p>
            <span className="mt-auto flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}
