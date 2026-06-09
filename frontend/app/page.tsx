"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Beaker, Network, Radio, ShieldCheck, Upload as UploadIcon } from "lucide-react";
import { writeWorkspace, type Workspace } from "@/lib/workspace";

interface EntryCard {
  ws: Workspace;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  bullets: string[];
  cta: string;
  badge?: string;
  accent: "primary" | "muted";
}

const CARDS: EntryCard[] = [
  {
    ws: "demo",
    href: "/dashboard",
    icon: Beaker,
    title: "Demo workspace",
    body: "Explore a synthetic but marketing-shaped dataset — two brands across products, verticals, markets, segments, 24 monthly tracker waves and six campaigns. Every diagnostic computes from bundled data, no backend required.",
    bullets: [
      "Brand → product → market → segment → campaign hierarchy",
      "Measured couplings, tensions, segment differences, rolling regime",
      "Campaign field simulation kept separate from observed validation",
    ],
    cta: "Open demo workspace",
    badge: "Recommended",
    accent: "primary",
  },
  {
    ws: "live",
    href: "/dashboard/data",
    icon: UploadIcon,
    title: "Live workspace",
    body: "Bring your own brand tracker, campaign calendar, creative memory map and outcomes. Validation runs in your browser; couplings and simulations compute live against the optional FastAPI service.",
    bullets: [
      "Upload tracker / campaign / outcome tables",
      "Method status shows which analyses your data unlocks",
      "Live compute via the FastAPI sidecar",
    ],
    cta: "Set up your data",
    accent: "muted",
  },
];

const ACCENT: Record<string, { border: string; hover: string; chip: string; cta: string }> = {
  primary: {
    border: "border-primary/30",
    hover: "hover:border-primary/50 hover:bg-primary/5",
    chip: "bg-primary/10 text-primary",
    cta: "text-primary",
  },
  muted: {
    border: "border-border",
    hover: "hover:border-foreground/30 hover:bg-muted/40",
    chip: "bg-muted text-foreground/70",
    cta: "text-foreground",
  },
};

const PILLARS = [
  { icon: Network, label: "What the brand means", note: "Memory map of reinforcing & conflicting associations" },
  { icon: ShieldCheck, label: "Where it's coherent or contradictory", note: "Frustrated edges, triads, competitive leakage" },
  { icon: Radio, label: "What's shifting it", note: "Campaign field response by product, segment, wave" },
];

export default function LandingPage() {
  const router = useRouter();

  function pick(card: EntryCard) {
    writeWorkspace(card.ws);
    router.push(card.href);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/40">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12">
        <header className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
            <Network className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Spin-Glass</p>
            <p className="text-[11px] text-muted-foreground">Brand Memory &amp; Campaign Dynamics</p>
          </div>
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            V3
          </span>
        </header>

        <section className="mt-14 max-w-3xl space-y-5">
          <p className="eyebrow text-primary">A marketing diagnostic workbench</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Diagnose{" "}
            <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              brand memory
            </span>{" "}
            like a physical system
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            A spin-glass view of brand associations: estimate the coupling structure between trust, premium, value,
            fun and competitor salience, find the tensions that pull a brand apart, and simulate how a campaign field
            would move it — for a chosen brand, product, market and audience segment.
          </p>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.label} className="rounded-xl border bg-card/70 p-4">
                <Icon className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm font-medium">{p.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.note}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {CARDS.map((card) => {
            const Icon = card.icon;
            const accent = ACCENT[card.accent];
            return (
              <button
                key={card.ws}
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

        <footer className="mt-auto space-y-3 pt-12 text-xs text-muted-foreground">
          <p>
            A diagnostic and simulation workbench — not a forecasting oracle. The bundled dataset is synthetic, and
            outcome calibration stays disabled until real sales or conversion data is supplied. The commodity paper
            benchmark lives under Methods. See the{" "}
            <a href="/dashboard/faq" className="text-primary hover:underline">FAQ</a> for what each science and
            data-sufficiency badge means.
          </p>
          <p className="border-t pt-3">
            Built by{" "}
            <a
              href="https://github.com/matiyashu"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary hover:underline"
            >
              Prima Hanura Akbar
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
