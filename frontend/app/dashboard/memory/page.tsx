"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ChartCard } from "@/components/chart-card";
import { ChartFaq } from "@/components/chart-faq";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { MemoryOverlap } from "@/components/charts/memory-overlap";
import { demoLoader, type MemoryPayload } from "@/lib/demo-loader";
import { FEATURE_LABEL } from "@/lib/features";
import { useMode } from "@/lib/mode";

const FAQ = [
  {
    q: "What is a 'memory pattern'?",
    a: (
      <p>
        A length-10 vector of +1 / −1 spins. +1 marks an association that <em>should</em> be active in the desired
        brand state; −1 marks one that should be silent. The target pattern is the brand strategy translated into the
        system&rsquo;s language; the competitor pattern is the rival&rsquo;s.
      </p>
    ),
  },
  {
    q: "How is overlap computed?",
    a: (
      <p>
        For each scenario, the kernel runs Glauber MCMC to equilibrium and averages the spins. Overlap is the inner
        product between that mean spin vector and the pattern, divided by 10. It always falls in [−1, +1].
      </p>
    ),
  },
  {
    q: "What's a 'good' target-overlap value?",
    a: (
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>≥ +0.5</strong> — the brand has clearly retrieved the intended memory.</li>
        <li><strong>+0.2 to +0.5</strong> — partial retrieval, useful uplift but the pattern isn&rsquo;t locked in.</li>
        <li><strong>−0.1 to +0.1</strong> — noise. The campaign isn&rsquo;t moving the system.</li>
        <li><strong>&lt; −0.2</strong> — the brand is being remembered as the <em>opposite</em> of intent.</li>
      </ul>
    ),
  },
  {
    q: "Why does competitor overlap mirror target overlap?",
    a: (
      <p>
        In this demo, the competitor pattern is the bit-flip of the target. That&rsquo;s by construction — it makes the
        diagnostic cleanest. With real data the two patterns rarely flip cleanly, so the curves won&rsquo;t be perfect
        reflections.
      </p>
    ),
  },
  {
    q: "Could a campaign lift target overlap and lift competitor overlap?",
    a: (
      <p>
        Yes — that&rsquo;s a category-builder. The system reaches a state that satisfies <em>both</em> patterns&rsquo;
        active features (typically the generic category-relevant ones) without resolving the disagreements. Diagnostic
        tell: target overlap rises but frustration also rises.
      </p>
    ),
  },
];

export default function MemoryPage() {
  const [mode] = useMode();
  const [payload, setPayload] = useState<MemoryPayload | null>(null);

  useEffect(() => {
    if (mode === "demo") demoLoader.memory().then(setPayload);
  }, [mode]);

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

      {mode === "live" ? (
        <EmptyState
          title="Memory comparison runs on your data"
          body="Define your target and competitor patterns, then upload a tracker. The live overlap series populates this chart once the optional FastAPI service is running."
        />
      ) : (
        payload && (
          <>
            <section className="grid gap-4 md:grid-cols-2">
              <PatternCard
                title="Target memory"
                pattern={payload.target_pattern}
                features={payload.features}
                tone="primary"
              />
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
        )
      )}

      <ChartFaq
        intro="Overlap is the most actionable single number in the framework — it tells you whether the campaign retrieved the meaning you actually intended."
        items={FAQ}
      />
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
        The pattern is a vector of {`+1 / −1`} spins; +1 means the association should be active in the desired brand
        state.
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
