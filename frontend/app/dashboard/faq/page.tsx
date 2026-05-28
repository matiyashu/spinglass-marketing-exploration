import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { FaqAccordion, type FaqItem } from "@/components/faq-accordion";

const ITEMS: FaqItem[] = [
  {
    q: "What is a spin-glass and why use it for brand health?",
    a: (
      <>
        <p>
          A spin-glass is a system of binary variables (each a +1 / −1 spin) connected by pairwise couplings that can be
          reinforcing or in tension. It comes from statistical physics and is used to model materials whose magnetic
          components disagree about how to align — there is no single coherent ground state, just many competing local
          minima.
        </p>
        <p>
          Brand memory looks exactly like that. Some associations reinforce each other (trust ↔ consideration). Others
          actively conflict (premium ↔ value-for-money). The framing lets us read structural questions a KPI table
          can&rsquo;t: is the brand becoming more coherent, or fragmenting?
        </p>
      </>
    ),
  },
  {
    q: "How is this different from a standard correlation matrix?",
    a: (
      <p>
        A correlation matrix is the <em>input</em> to the spin-glass framing. The extra layers on top are: a Hamiltonian
        defining how stable each configuration is, an external field representing campaign pressure, a Hopfield memory
        attractor encoding the strategic brand pattern, and Glauber dynamics that let you simulate what the system does
        under perturbation. The matrix tells you what is correlated; the spin-glass tells you what the system will{" "}
        <em>do</em> when you push on it.
      </p>
    ),
  },
  {
    q: "What are the 10 features, and can I change them?",
    a: (
      <p>
        The current build is hard-coded to ten classical brand-health features (ad recall, brand link, distinctive
        asset, trust, value-for-money, premium, fun, personal relevance, consideration, competitor salience). They were
        chosen because they cover the diagnostic dimensions Ehrenberg-Bass and CBM literature treat as core. You can
        retrain the kernel against a different feature set, but the demo data and the validator are pinned to these.
      </p>
    ),
  },
  {
    q: "What does a “coupling” mean in practical marketing terms?",
    a: (
      <p>
        A positive coupling between two features means that when one is active in a respondent&rsquo;s memory, the other
        is likely to be active too — they reinforce each other. A negative coupling means activating one tends to
        suppress the other. Negative couplings carry most of the diagnostic weight: a strongly negative{" "}
        <code className="font-mono text-xs">brand_link ↔ competitor_salience</code> says the moment your brand is salient,
        a rival&rsquo;s isn&rsquo;t, and vice versa.
      </p>
    ),
  },
  {
    q: "Spin-glass vs Ising vs MI mode — when do I use which?",
    a: (
      <>
        <p>
          <strong>Spin-glass</strong> uses signed correlation. It&rsquo;s the most informative because it preserves
          tensions. Start here.
        </p>
        <p>
          <strong>Ising</strong> uses absolute correlation. It collapses tensions into total synchronisation strength —
          useful as a benchmark for &ldquo;how strongly is everything moving together&rdquo; but blind to direction.
        </p>
        <p>
          <strong>Mutual information</strong> captures nonlinear dependencies that correlation misses (e.g. trust is
          high only when both fun <em>and</em> distinctive asset are active). Use it as a second pass.
        </p>
      </>
    ),
  },
  {
    q: "What is “frustration” and why does it matter?",
    a: (
      <p>
        Frustration is the share of signed edges that the system can&rsquo;t simultaneously satisfy. If
        premium ↔ value-for-money is negative but both spins want to be +1 because the local field favours them, one of
        them must lose. High frustration = the brand is being asked to mean contradictory things at once. Lower
        frustration after a campaign = the meaning has consolidated.
      </p>
    ),
  },
  {
    q: "How do I read the energy-landscape chart?",
    a: (
      <p>
        The x-axis is brand state, from competitor-aligned (−1) to target-aligned (+1). The y-axis is energy — lower
        energy basins are where the system spends most of its time. A baseline curve with two shallow minima means the
        market is bistable. A campaign field tilts the whole landscape; durable success deepens the target basin so the
        new minimum survives even after the field is removed.
      </p>
    ),
  },
  {
    q: "What is hysteresis telling me about my brand?",
    a: (
      <p>
        Hysteresis means the brand state depends on the path, not just the current spend level. The increasing-pressure
        curve flips later than the decreasing-pressure curve, so at the same h there are two stable states. Practically:
        once you&rsquo;ve switched a market, it stays switched at lower maintenance spend than it took to flip it. The
        loop width is the &ldquo;stickiness&rdquo; budget.
      </p>
    ),
  },
  {
    q: "What is pulse response, and what does the time axis mean?",
    a: (
      <p>
        Pulse response is the system&rsquo;s reply to a finite campaign window. The buzz curve rises and falls fast —
        that&rsquo;s short-term recall. The memory curve rises slower, peaks lower, but leaves a residue after the
        campaign ends. Time steps are abstract (one MCMC sweep) — when calibrated to a real tracker you read them as
        weeks or wave intervals.
      </p>
    ),
  },
  {
    q: "How much data do I need, and what format?",
    a: (
      <p>
        Hard minimum 50 rows; couplings stabilise around 200+. The format is a CSV with the ten required columns. Pure
        0/1 columns pass through unchanged; Likert/continuous columns are median-split into +1/−1. Up to 5 % NaN per
        column is tolerated. See the{" "}
        <a href="/dashboard/data-requirements" className="text-primary hover:underline">
          data-requirements page
        </a>{" "}
        for the full spec.
      </p>
    ),
  },
  {
    q: "Is my uploaded data sent to a server?",
    a: (
      <p>
        No. In demo mode the validator runs entirely in your browser using{" "}
        <code className="font-mono text-xs">papaparse</code>. Nothing leaves the page. The optional FastAPI bridge in{" "}
        <code className="font-mono text-xs">backend/api/</code> is something you run locally on your own machine when
        you want live computation against your data.
      </p>
    ),
  },
  {
    q: "How do scenario simulations work?",
    a: (
      <p>
        Each scenario picks a target memory pattern (the brand associations you want active), a campaign spend level
        that pushes the external field h toward that pattern, and runs a Glauber MCMC sampler to equilibrium. The
        resulting sample distribution gives memory overlap, competitor overlap, frustration, and a downstream purchase
        probability fitted in a logit layer. The bundled scenarios are baseline, moderate, and heavy campaign.
      </p>
    ),
  },
  {
    q: "Can I export reports?",
    a: (
      <p>
        Yes. The reports tab links to the five reference PNGs and to the full 12-page PDF brief generated by{" "}
        <code className="font-mono text-xs">generate_spin_glass_marketing_report.py</code>. PDF regeneration on
        uploaded data needs the FastAPI service.
      </p>
    ),
  },
  {
    q: "Roadmap — when does live compute land?",
    a: (
      <p>
        The FastAPI skeleton is already in <code className="font-mono text-xs">backend/api/</code>. Wiring the
        endpoints to the existing kernel functions is a follow-up build. After that, parameter-chaos overlap
        q(T, T+δT), Random-Field Ising heterogeneity, and a CLI (
        <code className="font-mono text-xs">spinglass simulate</code>) are next.
      </p>
    ),
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="Get started" title="FAQ" description="Concepts, conventions, and where the framing comes from." />
      <SummaryBox title="Why these questions">
        The questions below come from the assumptions that surprise people first time they see the framing — what a
        coupling really means, why frustration is interesting, what the time axis on a pulse-response chart actually
        measures, and what the kernel does and does not predict.
      </SummaryBox>
      <FaqAccordion items={ITEMS} />
    </>
  );
}
