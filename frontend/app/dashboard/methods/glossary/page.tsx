"use client";

import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { ScienceBadge, type ScienceStatus } from "@/components/science-badge";

interface Term {
  term: string;
  status: ScienceStatus;
  body: string;
}

const TERMS: Term[] = [
  { term: "Coupling J_ij", status: "measured", body: "Signed correlation between two binarized brand associations across respondents. Positive = reinforcing, negative = a tension." },
  { term: "|corr| (Ising)", status: "measured", body: "Absolute correlation — total association strength regardless of sign. The synchronisation benchmark an Ising model would see." },
  { term: "Mutual information", status: "experimental", body: "Nonlinear dependence via quantile binning. Non-negative; signing it (× sign of correlation) is a modelling heuristic, not a proven coupling." },
  { term: "Leading eigenvalue", status: "measured", body: "Largest eigenvalue of the coupling matrix — how synchronised the brand's associations are. Rises when meaning collapses into one aligned state." },
  { term: "Negative-edge / tension share", status: "measured", body: "Fraction of association pairs with a negative coupling. Healthy diversity of meaning vs collapse." },
  { term: "Frustrated triad", status: "measured", body: "A triangle of associations with an odd number of negative edges — they cannot all be mutually satisfied. Guardrailed to all |J| ≥ 0.12." },
  { term: "Memory pattern ξ (Hopfield)", status: "illustrative", body: "A declared target vector a campaign means to activate. An attractor added to the coupling matrix in simulation." },
  { term: "Target overlap", status: "simulation", body: "Mean alignment of sampled states with a target memory pattern: −1 opposite, 0 unrelated, +1 retrieved." },
  { term: "Frustration", status: "simulation", body: "Share of active signed edges violated in sampled states — strategic contradiction under a given field." },
  { term: "Rigidity proxy", status: "measured", body: "(1/N)Σ⟨sᵢ⟩² — how polarised association means are. A PROXY, not the full Edwards-Anderson order parameter, which needs replica or long-time overlap." },
  { term: "Landscape replicas P(q)", status: "simulation", body: "Overlap distribution of independent chains under fixed J, h, β. Broad/multimodal = competing simulated states — not RSB proof in a finite panel." },
  { term: "Estimation-stability replicas P(q)", status: "measured", body: "Overlap of couplings across bootstrap resamples. Concentrated near 1 = the estimated structure is robust to sampling." },
  { term: "Susceptibility χᵢ", status: "simulation", body: "d⟨sᵢ⟩/dhᵢ — how much an association responds to a small field push. High = movable lever; low = entrenched." },
  { term: "Campaign pressure / field h(t)", status: "illustrative", body: "Normalised spend / reach / frequency combined into a scalar field intensity, applied via the creative pattern. A modelling assumption." },
];

export default function GlossaryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Methods"
        title="Model glossary"
        description="Every quantity the workbench reports, in plain language, with its scientific status."
      />
      <SummaryBox title="How to read the status badges">
        <span className="font-medium">Measured</span> is estimated directly from data. <span className="font-medium">Simulation</span> is
        generated from declared parameters. <span className="font-medium">Illustrative</span> conveys the mathematical
        form. <span className="font-medium">Experimental</span> uses an unvalidated heuristic. Nothing here is a
        forecast unless validated against outcomes.
      </SummaryBox>

      <section className="space-y-2">
        {TERMS.map((t) => (
          <div key={t.term} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{t.term}</h3>
              <ScienceBadge status={t.status} inline />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
