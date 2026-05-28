# frontend — spin-glass dashboard

Next.js 14 dashboard for the spin-glass marketing exploration. The dashboard
ships in **demo mode**: every chart renders from JSON pre-computed by the
Python kernel, while the upload + validation tabs work against your real CSV
fully in the browser. A &ldquo;Run on my data&rdquo; button is wired up but
stubbed until the optional FastAPI sidecar in [`../backend/api/`](../backend/api/) is running.

## Routes

| Route | What it does |
|---|---|
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
the chart shows, and a blue one at the bottom explaining how to read it.

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
