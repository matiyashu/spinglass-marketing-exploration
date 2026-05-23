# frontend — dashboard (planned)

This folder is reserved for the future spin-glass marketing dashboard. Nothing
ships here yet.

## Planned shape

A small Next.js app that talks to the [`backend/`](../backend/) FastAPI surface:

- **Couplings page** — upload a brand-tracker CSV, render the signed-coupling
  heatmap and the top reinforcing/tension pairs.
- **Memory & campaign page** — define a target memory pattern, pick a
  baseline `h`, sweep campaign spend, plot target/competitor overlap and
  frustration.
- **Landscape page** — energy-landscape visual and pulse-response plot for a
  chosen feature.
- **Stress test** — parameter-chaos overlap `q(T, T+δT)` across temperatures.

## Stack (tentative)

- Next.js 14 (app router) + TypeScript
- Recharts (or visx) for plots
- Talks to `backend/` via REST; PDF export reuses the ReportLab path

Until the backend exposes an API, the dashboard work is intentionally not
started — the kernel and the PDF brief are the source of truth.
