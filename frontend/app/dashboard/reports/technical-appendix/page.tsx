"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ScienceBadge } from "@/components/science-badge";
import { useWorkspace } from "@/lib/workspace";
import { useAsync } from "@/lib/use-async";
import { fetchMethodStatus } from "@/lib/marketing";

const FORMULAS: { name: string; formula: string; note: string }[] = [
  { name: "Couplings (spin-glass)", formula: "J_ij = corr(s_i, s_j),  J_ii = 0", note: "Signed Pearson correlation of binarized associations." },
  { name: "Ising benchmark", formula: "J_ij^Ising = |corr(s_i, s_j)|", note: "Synchronisation strength, sign discarded." },
  { name: "Mutual information", formula: "I(s_i; s_j) = Σ p(x,y) log[ p(x,y) / p(x)p(y) ]", note: "Quantile-binned; non-negative; signed MI is a heuristic." },
  { name: "Memory term (Hopfield)", formula: "J^mem = (ξᵀ ξ) / N,  diag = 0", note: "A declared target pattern ξ becomes an attractor." },
  { name: "Glauber update", formula: "P(flip) = 1 / (1 + exp(β · 2 sᵢ (hᵢ + Σⱼ Jᵢⱼ sⱼ)))", note: "Single-spin equilibrium sampling." },
  { name: "Target overlap", formula: "m = (1/N) ⟨ s · ξ ⟩", note: "−1 opposite, 0 unrelated, +1 retrieved." },
  { name: "Frustration", formula: "fraction of edges with sign(Jᵢⱼ)·sᵢ·sⱼ < 0", note: "Violated signed relations under sampled states." },
  { name: "Rigidity proxy", formula: "q* = (1/N) Σᵢ ⟨sᵢ⟩²", note: "PROXY — not the Edwards-Anderson order parameter." },
  { name: "Overlap distribution", formula: "q_ab = (1/N) Σᵢ sᵢ^a sᵢ^b ;  P(q)", note: "Landscape (fixed J,h,β) vs estimation (bootstrap) — kept separate." },
  { name: "Susceptibility", formula: "χᵢ = d⟨sᵢ⟩ / dhᵢ", note: "Numerical sensitivity of an association to its field." },
  { name: "Campaign pressure", formula: "pressure = w·z(log(1+spend)) + … ;  hᵢ(t) = hᵢ⁰ + pressure · aᵢ", note: "Delivery metrics shape the field, not the couplings." },
];

export default function TechnicalAppendixPage() {
  const [ws] = useWorkspace();
  const { data } = useAsync(() => fetchMethodStatus(ws), [ws]);

  return (
    <>
      <PageHeader eyebrow="Reports" title="Technical appendix" description="The formulas behind every metric, with scientific status and current method availability." />

      <SummaryBox title="Scientific framing">
        Direct paper backing is strongest for rolling coupling matrices, average coupling, leading eigenvalue, MI as
        non-negative dependence, and signed topology. Replica overlap, Hopfield memory, susceptibility and stress tests
        are valid spin-glass extensions — labelled as such, never presented as commodity-paper-proven results.
      </SummaryBox>

      <div className="flex flex-wrap gap-2">
        <ScienceBadge status="measured" /> <ScienceBadge status="simulation" />
        <ScienceBadge status="illustrative" /> <ScienceBadge status="experimental" />
      </div>

      <section className="space-y-2">
        {FORMULAS.map((f) => (
          <div key={f.name} className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">{f.name}</p>
            <pre className="mt-1.5 overflow-x-auto rounded-md bg-muted/60 px-3 py-2 font-mono text-xs text-foreground">{f.formula}</pre>
            <p className="mt-1.5 text-xs text-muted-foreground">{f.note}</p>
          </div>
        ))}
      </section>

      {data && (
        <section className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method availability ({ws})</p>
          <ul className="mt-2 grid gap-1 text-sm md:grid-cols-2">
            {data.methods.map((m) => (
              <li key={m.method} className="flex items-center justify-between gap-2">
                <span>{m.label}</span>
                <span className={m.enabled ? "text-emerald-700" : "text-muted-foreground"}>{m.enabled ? "enabled" : "missing " + m.missing.join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
