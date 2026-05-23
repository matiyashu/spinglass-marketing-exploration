# backend — spin-glass / Ising kernel

Python research kernel and PDF report generator. This is the engine; a future
FastAPI surface and the [`frontend/`](../frontend/) dashboard will sit on top of it.

## Modules

- **`brand_ising_spin_glass.py`** — the kernel. Couplings (signed correlation,
  Ising, mutual-information signed/unsigned), Hopfield memory attractor,
  mean-field `h`-baseline inference, Glauber MCMC sampler, metrics
  (`memory_overlap`, `frustration_rate`), and `summarize_scenario` returning a
  `ScenarioResult` dataclass. Has a self-contained `demo()` entry point that
  prints scenario results and the top recovered couplings.

- **`generate_spin_glass_marketing_report.py`** — runs the synthetic scenario,
  renders five reference figures (heatmap, scenarios, pulse response,
  hysteresis, energy landscape), and assembles a 12-page PDF brief via
  ReportLab. Writes to `docs/spin_glass_brand_marketing_report.pdf` and
  `spin_glass_report_figures/*.png`.

## Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt

python brand_ising_spin_glass.py            # quick CLI demo of the kernel
python generate_spin_glass_marketing_report.py   # rebuilds the PDF + figures
```

## Future API surface (planned, not yet built)

When the dashboard arrives, this folder will also host a FastAPI app exposing:

- `POST /couplings` — upload a panel, get back `J_spin_glass` and `J_ising`.
- `POST /simulate` — given `J`, `h`, a target pattern, and a spend ramp,
  return overlap / frustration / purchase-probability per scenario.
- `POST /report` — trigger a PDF render for a given scenario.

For now the only entry point is the local script.
