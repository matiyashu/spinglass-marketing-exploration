"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, FlaskConical, LineChart, Upload as UploadIcon } from "lucide-react";
import { writeMode, type Mode } from "@/lib/mode";

interface ModeCard {
  mode: Mode;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  bullets: string[];
  cta: string;
  badge?: string;
  accent: string;
}

const CARDS: ModeCard[] = [
  {
    mode: "demo-commodity",
    href: "/dashboard/commodity",
    icon: LineChart,
    title: "Commodity demo · paper-aligned",
    body: "Walk the descriptive workflow on a 15-asset commodity panel: rolling signed-correlation couplings, |corr| Ising benchmark, mutual information, and the largest eigenvalue across COVID and energy-crisis regimes.",
    bullets: [
      "5 years of synthetic commodity-like daily returns",
      "Rolling window 90 / step 30 with QA-target reproduction",
      "Closest to the published methodology",
    ],
    cta: "Open commodity dashboard",
    badge: "Recommended",
    accent: "primary",
  },
  {
    mode: "demo-brand",
    href: "/dashboard",
    icon: FlaskConical,
    title: "Brand demo · synthetic application",
    body: "Apply the same framing to brand-tracker data. Equilibrium simulation, memory overlap and frustration on a synthetic Hopfield-style panel with a 12-week campaign window.",
    bullets: [
      "10 brand-tracker features, weekly panel for a year",
      "Target / competitor pattern overlap explorer",
      "Clearly labeled synthetic — not validated outcomes",
    ],
    cta: "Open brand dashboard",
    accent: "info",
  },
  {
    mode: "live",
    href: "/dashboard/upload",
    icon: UploadIcon,
    title: "Start with my own data",
    body: "Charts render empty until you upload a CSV and start the optional FastAPI service. Validation runs entirely in your browser.",
    bullets: [
      "Drag-drop CSV with spin-glass validation rules",
      "Live compute needs the optional FastAPI sidecar",
      "Switch back to either demo at any time",
    ],
    cta: "Go to upload",
    accent: "muted",
  },
];

const ACCENT_CLASSES: Record<string, { border: string; hover: string; chip: string; cta: string }> = {
  primary: {
    border: "border-primary/30",
    hover: "hover:border-primary/50 hover:bg-primary/5",
    chip: "bg-primary/10 text-primary",
    cta: "text-primary",
  },
  info: {
    border: "border-blue-200",
    hover: "hover:border-blue-300 hover:bg-blue-50/60",
    chip: "bg-blue-100 text-blue-700",
    cta: "text-blue-700",
  },
  muted: {
    border: "border-border",
    hover: "hover:border-foreground/30 hover:bg-muted/40",
    chip: "bg-muted text-foreground/70",
    cta: "text-foreground",
  },
};

export default function LandingPage() {
  const router = useRouter();

  function pick(card: ModeCard) {
    writeMode(card.mode);
    router.push(card.href);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/40">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12">
        <header className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
            <FlaskConical className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Spin-Glass</p>
            <p className="text-[11px] text-muted-foreground">Marketing exploration</p>
          </div>
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            V2
          </span>
        </header>

        <section className="mt-14 max-w-3xl space-y-5">
          <p className="eyebrow text-primary">A research dashboard</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Three lenses on an{" "}
            <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              interdependence problem
            </span>
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            The same Ising / spin-glass / mutual-information workflow applied to commodity time series (paper-aligned)
            and brand-tracker panels (synthetic application). Pick how you&rsquo;d like to enter.
          </p>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            const accent = ACCENT_CLASSES[card.accent];
            return (
              <button
                key={card.mode}
                type="button"
                onClick={() => pick(card)}
                className={`group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-6 text-left shadow-sm transition-all hover:shadow-md ${accent.border} ${accent.hover}`}
              >
                {card.badge && (
                  <span className={`absolute right-4 top-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${accent.chip}`}>
                    {card.badge}
                  </span>
                )}
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.chip}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{card.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{card.body}</p>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {card.bullets.map((b) => (
                    <li key={b}>· {b}</li>
                  ))}
                </ul>
                <span className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${accent.cta}`}>
                  {card.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            );
          })}
        </section>

        <footer className="mt-auto pt-12 text-xs text-muted-foreground">
          <p>
            This dashboard is a diagnostic, simulation-based exploration — not a forecasting oracle. The bundled
            scenarios are synthetic data. Calibrate against your own tracker or price series before drawing decisions.
            See the <a href="/dashboard/faq" className="text-primary hover:underline">FAQ</a> for what each scientific
            status badge means.
          </p>
        </footer>
      </div>
    </main>
  );
}
