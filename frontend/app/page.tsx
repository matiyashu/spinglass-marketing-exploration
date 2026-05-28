"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, FlaskConical, Upload as UploadIcon } from "lucide-react";
import { writeMode } from "@/lib/mode";

export default function LandingPage() {
  const router = useRouter();

  function pick(mode: "demo" | "live", href: string) {
    writeMode(mode);
    router.push(href);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/40">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12">
        <header className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
            <FlaskConical className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Spin-Glass</p>
            <p className="text-[11px] text-muted-foreground">Marketing exploration</p>
          </div>
        </header>

        <section className="mt-16 max-w-3xl space-y-5">
          <p className="eyebrow text-primary">A research dashboard</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Brand memory as an{" "}
            <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              energy landscape
            </span>
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            Ising synchronization, signed spin-glass couplings, Hopfield attractors and Glauber dynamics — applied to
            brand tracking and campaign measurement. Pick how you&rsquo;d like to enter.
          </p>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => pick("demo", "/dashboard")}
            className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-6 text-left shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
          >
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-primary">
              Recommended
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Explore in demo mode</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Walk every chart with a bundled synthetic scenario. Nothing to install, no backend required, every tab
                renders the moment you click it.
              </p>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>· 10 brand features modelled, three campaign scenarios</li>
              <li>· Spin-glass / Ising / MI coupling heatmaps</li>
              <li>· Energy landscape, hysteresis, pulse response</li>
            </ul>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open the dashboard <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => pick("live", "/dashboard/upload")}
            className="group flex flex-col gap-3 rounded-2xl border bg-card p-6 text-left shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/60 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <UploadIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Start with my own data</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Skip the worked example. Charts render empty until you upload a CSV and start the optional backend.
                Validation runs entirely in your browser.
              </p>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>· Drag-drop CSV with 10 spin-glass validation rules</li>
              <li>· Live compute needs the optional FastAPI sidecar</li>
              <li>· You can switch back to demo mode anytime</li>
            </ul>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
              Go to upload <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </section>

        <footer className="mt-auto pt-12 text-xs text-muted-foreground">
          <p>
            This is a diagnostic, simulation-based exploration — not a forecasting oracle. The bundled scenarios are
            calibrated on synthetic data. Calibrate against your own tracker before drawing decisions.
          </p>
        </footer>
      </div>
    </main>
  );
}
