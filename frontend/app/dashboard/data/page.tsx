"use client";

import Link from "next/link";
import { Database, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { MethodStatusBar } from "@/components/method-status-bar";
import { DataSufficiencyBadge } from "@/components/data-sufficiency-badge";
import { useWorkspace } from "@/lib/workspace";
import { useAsync } from "@/lib/use-async";
import { fetchMethodStatus } from "@/lib/marketing";

const TABLES = [
  { id: "tracker", name: "brand_tracker_panel.csv", desc: "Respondent × wave × brand × product × market × segment, with the 10 association features.", required: true },
  { id: "campaigns", name: "campaign_calendar.csv", desc: "Campaign windows, channel, spend, reach, frequency.", required: false },
  { id: "creative_map", name: "creative_memory_map.csv", desc: "Declared target spin / strength per creative — the memory pattern ξ.", required: false },
  { id: "outcomes", name: "outcomes_partial.csv", desc: "Conversions, CPA, ROAS, brand lift — only some campaigns. Unlocks outcome validation.", required: false },
  { id: "competitor", name: "competitor_context.csv", desc: "Competitor spend, share of voice, category demand — an opposing field.", required: false },
];

export default function DataSetupPage() {
  const [ws] = useWorkspace();
  const { data } = useAsync(() => fetchMethodStatus(ws), [ws]);
  const present = new Set(data?.tables_present ?? []);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Data setup"
        description="The tables that feed the workbench, and what each one unlocks. The demo ships all of them; live mode reads what you upload."
      />
      <MethodStatusBar science="measured" methods={["brand_couplings", "campaign_field", "outcome_validation"]} note={ws === "live" ? "Live workspace" : "Demo workspace"} />

      <SummaryBox title="Four data roles">
        Not every column is a coupling. The tracker associations are <strong>state variables</strong>; campaign spend
        and reach are <strong>external fields</strong>; sales and ROAS are <strong>outcomes</strong> for validation;
        competitor spend and price are <strong>context</strong>. Performance metrics like CTR/CPC/CPA help shape the
        field or validate outcomes — they are never used directly as spin-glass couplings.
      </SummaryBox>

      <section className="space-y-2">
        {TABLES.map((t) => (
          <div key={t.id} className="flex items-start gap-3 rounded-xl border bg-card p-4">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-sm font-medium">{t.name}</code>
                {t.required && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">required</span>}
                <DataSufficiencyBadge enabled={present.has(t.id)} label={present.has(t.id) ? "loaded" : "not loaded"} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {ws === "live" && (
        <Link href="/dashboard/upload" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Upload className="h-4 w-4" /> Upload & validate a table
        </Link>
      )}
    </>
  );
}
