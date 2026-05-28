# frontend — spin-glass dashboard

Next.js 14 dashboard for the spin-glass marketing exploration. The dashboard
ships in **demo mode**: every chart renders from JSON pre-computed by the
Python kernel, while the upload + validation tabs work against your real CSV
fully in the browser. A &ldquo;Run on my data&rdquo; button is wired up but
stubbed until the optional FastAPI sidecar in [`../backend/api/`](../backend/api/) is running.

## Routes

| Route | What it does |
|---|---|
| `/` | **Landing page** — pick demo mode or live mode |
| `/dashboard` | Overview + entry-point cards |
| `/dashboard/data-requirements` | The 10 feature columns explained + CSV template |
| `/dashboard/upload` | Drag-drop CSV with client-side validation |
| `/dashboard/faq` | Concept FAQ |
| `/dashboard/couplings` | Heatmap with spin-glass / Ising / MI toggle |
| `/dashboard/memory` | Target vs competitor pattern + overlap per scenario |
| `/dashboard/scenarios` | Baseline → moderate → heavy campaign table + chart |
| `/dashboard/landscape` | Energy landscape + hysteresis loop |
| `/dashboard/pulse` | Short-term buzz vs long-term memory pulse response |
| `/dashboard/reports` | 5 reference PNGs + PDF download link |

Every analysis tab carries a teal `<SummaryBox>` at the top explaining what
the chart shows, a blue one near the bottom explaining how to read it, and a
chart-specific FAQ accordion with 4–5 items on how to interpret the values.

## Modes

The landing page asks how you want to enter. The choice is stored in
`localStorage` and can be flipped at any time from the sidebar footer.

- **Demo mode** — every analysis chart renders from bundled JSON
  (`public/demo/*.json`). No backend needed; nothing to install beyond the
  Next.js app. Recommended for first-time exploration.
- **Live mode** — analysis charts render an empty-state CTA instead of demo
  data. Upload + validation still work fully in the browser. To populate the
  charts, start the optional FastAPI service in `../backend/api/` so the
  &ldquo;Run on my data&rdquo; flow can call it.

## Deploy to Vercel

The dashboard is a pure-frontend Next.js 14 app — no runtime database, no
server-side secrets, no Python in the request path. It builds and runs as a
standard Vercel project.

**Option A — Root Directory in the Vercel UI (recommended).**

1. Import `github.com/matiyashu/spinglass-marketing-exploration` in the
   Vercel dashboard.
2. When asked, set **Root Directory** to `frontend`.
3. Framework preset auto-detects as Next.js. Build command, install command
   and output directory are inferred. Click Deploy.

**Option B — Use the `vercel.json` at repo root.**

A `../vercel.json` is checked in for monorepo-style deploys without changing
the Root Directory:

```jsonc
{
  "framework": "nextjs",
  "buildCommand": "cd frontend && npm install && npm run build",
  "installCommand": "cd frontend && npm install",
  "outputDirectory": "frontend/.next"
}
```

**Demo data on Vercel.** The bundled JSON in `public/demo/` and the PNGs in
`public/figures/` are committed, so the deployed site has full demo content
without ever running the Python kernel. Re-run `dump_demo_json.py` locally
and commit the new JSON if you want to refresh the bundled scenario.

**Live mode on Vercel.** Vercel hosts the frontend only. The FastAPI service
is not deployable to a Vercel serverless function as-is (it would need
pinned NumPy/Pandas in a Python runtime). Two paths:

- Self-host the FastAPI service (Railway, Fly, your own box) and point the
  frontend at it via the env var `NEXT_PUBLIC_API_URL`.
- Keep the deployed site demo-only; the &ldquo;Run on my data&rdquo; button
  cleanly returns 501 with a hint pointing to the local setup.

## Stack

Next.js 14 (app router) · Tailwind · custom shadcn-style primitives ·
Recharts · papaparse · lucide-react. Theme is light with a teal/navy accent
matching `../assets/banner.svg`.

## Run

```bash
cd frontend
npm install
npm run dev            # http://localhost:3760
```

## Regenerate demo data

Every chart and the sample CSV come from
[`../backend/scripts/dump_demo_json.py`](../backend/scripts/dump_demo_json.py).
Re-run it after any kernel change:

```bash
cd ..
python backend/scripts/dump_demo_json.py
```

It writes into `public/demo/`. The five PNGs in `public/figures/` are copied
from `../backend/spin_glass_report_figures/`.

## Live compute (optional)

Start the FastAPI sidecar to enable real computation against uploaded data:

```bash
cd ../backend
pip install -r requirements.txt -r requirements-api.txt
cd api
uvicorn main:app --reload --port 8000
```

Then set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local` and the
&ldquo;Run on my data&rdquo; button on `/dashboard/upload` will proxy through
`/api/run`.
