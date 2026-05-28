"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { Badge } from "@/components/ui/badge";
import { MemoryOverlap } from "@/components/charts/memory-overlap";
import { demoLoader, type MemoryPayload } from "@/lib/demo-loader";
import { FEATURE_LABEL } from "@/lib/features";

export default function MemoryPage() {
  const [payload, setPayload] = useState<MemoryPayload | null>(null);

  useEffect(() => {
    demoLoader.memory().then(setPayload);
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Analysis"
        title="Memory & campaign"
        description="Does the campaign retrieve the brand memory you intend, or the competitor's?"
      />

      <SummaryBox title="What you're looking at">
        A &ldquo;memory&rdquo; is a pattern of {`+1 / −1`} spins encoding which associations should be active. We compare
        each scenario&rsquo;s equilibrium distribution against two patterns: the brand&rsquo;s desired target memory
        (teal) and the competitor&rsquo;s (red). Overlap near +1 = pattern retrieved; overlap near −1 = opposite pattern
        retrieved.
      </SummaryBox>

      {payload && (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <PatternCard title="Target memory" pattern={payload.target_pattern} features={payload.features} tone="primary" />
            <PatternCard
              title="Competitor memory"
              pattern={payload.competitor_pattern}
              features={payload.features}
              tone="destructive"
            />
          </section>

          <ChartCard
            title="Memory overlap by scenario"
            subtitle="Mean overlap between the equilibrium spin distribution and each stored pattern."
            footer="As campaign pressure rises, the system drifts toward the target pattern and away from the competitor pattern."
          >
            <MemoryOverlap payload={payload} />
          </ChartCard>
        </>
      )}
    </>
  );
}

interface PatternCardProps {
  title: string;
  pattern: number[];
  features: string[];
  tone: "primary" | "destructive";
}

function PatternCard({ title, pattern, features, tone }: PatternCardProps) {
  const upClass = tone === "primary" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive";
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <Badge variant={tone === "primary" ? "default" : "destructive"}>
          {pattern.filter((p) => p === 1).length} / {pattern.length} active
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        The pattern is a vector of {`+1 / −1`} spins; +1 means the association should be active in the desired
        brand state.
      </p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {features.map((f, i) => (
          <li key={f} className="flex items-center justify-between gap-3">
            <span className="text-foreground/80">{FEATURE_LABEL[f as keyof typeof FEATURE_LABEL] ?? f}</span>
            <span
              className={
                pattern[i] === 1
                  ? `font-mono text-xs px-1.5 py-0.5 rounded ${upClass}`
                  : "font-mono text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              }
            >
              {pattern[i] === 1 ? "+1" : "−1"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
