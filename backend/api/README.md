# backend/api — optional FastAPI sidecar

This service is optional. The Next.js dashboard at `frontend/` works without
it; every chart renders from bundled JSON. Run this when you want the
&ldquo;Run on my data&rdquo; button to do real computation.

## Endpoints

- `GET  /health` — liveness probe.
- `POST /couplings` — body: `{rows, mode, scale}` → returns the recovered
  coupling matrix. `mode` is one of `spin_glass`, `ising`, `mi`.
- `POST /simulate` — body: `{rows, target_pattern, competitor_pattern,
  spend_levels, memory_strength}` → returns `ScenarioRow[]` matching the
  shape on `/dashboard/scenarios`.
- `POST /report` — placeholder; returns 501 until PDF-on-upload is wired up.

## Run

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt -r requirements-api.txt
cd api
uvicorn main:app --reload --port 8000
```

The dashboard auto-detects the service via `NEXT_PUBLIC_API_URL`. Without
that env var the `/api/run` route in the frontend returns 501 with a hint
pointing here.
