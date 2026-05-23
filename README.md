<p align="center">
  <img src="assets/banner.svg" alt="Spin-Glass Marketing Exploration — brand memory as an energy landscape" width="100%"/>
</p>

<p align="center">
  <b>What if brand memory were an energy landscape, and a campaign were an external field?</b><br/>
  Ising · Spin-Glass · Hopfield attractors · Glauber dynamics — applied to brand tracking and campaign measurement<br/>
  Made by <a href="https://github.com/matiyashu">Prima Hanura Akbar</a>
</p>

<p align="center">
  <img alt="status" src="https://img.shields.io/badge/stage-exploration-7c3aed?style=flat-square"/>
  <img alt="theory" src="https://img.shields.io/badge/theory-Ising%20%C2%B7%20Spin--glass%20%C2%B7%20Hopfield-0a7a3f?style=flat-square"/>
  <img alt="kernel" src="https://img.shields.io/badge/kernel-NumPy%20%C2%B7%20Glauber%20MCMC-3776ab?style=flat-square"/>
  <img alt="report" src="https://img.shields.io/badge/report-reportlab%20PDF-10b981?style=flat-square"/>
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"/>
</p>

---

## What is this?

**Spin-Glass Marketing Exploration** is a small research workbench that treats a market as a system of interacting binary states and asks: *how does a campaign reshape the landscape that brand memory lives in?*

Each consumer signal — ad recall, brand link, trust, value-for-money, premium, fun, consideration, competitor salience — is modeled as a **spin** in {−1, +1}. Reinforcing associations get **positive couplings**; tensions (premium vs value, brand link vs competitor salience) get **negative couplings**. A campaign is the **external field** `h(t)` that biases certain spins, and a desired brand memory is encoded as a **Hopfield attractor** in the coupling matrix.

The repo ships:

- A small NumPy kernel (`brand_ising_spin_glass.py`) with coupling estimators, a Hopfield memory layer, a Glauber MCMC sampler, and metric helpers.
- A self-contained simulation + PDF generator (`generate_spin_glass_marketing_report.py`) that reproduces the figures in the included [technical brief](docs/spin_glass_brand_marketing_report.pdf).
- An honest framing of what this is and isn't: a **diagnostic exploration**, not a prediction oracle.

**Why bother.** Standard brand trackers report KPI deltas in isolation. The spin-glass framing forces you to answer the questions KPI tables can't: *do my brand associations move together, or fragment?*, *does this campaign retrieve the memory I intend, or activate the competitor's pattern?*, *is the lift a quick perturbation, or did it deepen a basin?*, *will this impact survive a category shock?*

> ⚠️ **This is an exploration, not a production model.** The math is correct, the figures are reproducible, but the engine is calibrated to *synthetic* data. Plugging in a real tracker is the next step, and the README explains how.

---

## Quick start

```bash
git clone https://github.com/matiyashu/spinglass-marketing-exploration.git
cd spinglass-marketing-exploration

python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
python generate_spin_glass_marketing_report.py
```

That produces:

```
spin_glass_brand_marketing_report.pdf
spin_glass_report_figures/
    scenario_metrics.png
    signed_coupling_heatmap.png
    pulse_response.png
    hysteresis.png
    energy_landscape.png
```

The PDF is the full technical brief; the PNGs are the figures rendered standalone.

---

## The core analogy

| Marketing concept                | Spin-glass object                                       |
|----------------------------------|----------------------------------------------------------|
| Consumer state / brand association | spin `s_i ∈ {−1, +1}`                                   |
| Reinforcing pair (trust ↔ consider) | positive coupling `J_ij > 0`                            |
| Tension pair (premium ↔ value)     | negative coupling `J_ij < 0` *(spin-glass, not Ising)*  |
| Campaign / media / promo         | external field `h_i(t)`                                  |
| Desired brand memory             | Hopfield pattern `ξ`, stored as attractor in `J`         |
| Market volatility                | temperature `T = 1/β`                                    |
| Brand-memory retrieval           | overlap `m_μ = (1/N) Σ ξ_i s_i`                          |
| Fragmented meaning               | frustration: violated signed edges                       |
| Stickiness of a new state        | hysteresis width                                         |
| Fragility under macro shock      | parameter-chaos overlap `q(T, T+δT)`                     |

The system Hamiltonian:

```
E(s; t) = −½ Σ_{i≠j} J_ij s_i s_j  −  Σ_i h_i(t) s_i
P(s_i = +1 | s_{−i}) = σ(2β [h_i(t) + Σ_j J_ij s_j])
```

Glauber sampling explores the landscape; reading off `m_μ`, frustration, and competitor overlap turns the sample into KPIs.

---

## What the simulation actually shows

The bundled demo runs a 10-feature synthetic tracker (ad recall, brand link, distinctive asset, trust, value, premium, fun, personal relevance, consideration, competitor salience). It builds a "true" coupling matrix from two stored patterns (target + competitor) plus a handful of known category tensions, samples a synthetic panel, re-estimates couplings empirically, then runs three campaign scenarios.

| Scenario | Target overlap | Competitor overlap | Purchase prob. | Frustration |
|---------|---------------:|-------------------:|---------------:|------------:|
| baseline | -0.18 | +0.18 | 0.21 | 0.42 |
| moderate | +0.32 | −0.32 | 0.58 | 0.40 |
| heavy   | +0.61 | −0.61 | 0.80 | 0.29 |

As campaign pressure rises, the system drifts toward the **target** memory pattern, away from the **competitor** pattern, and frustration drops — i.e., the brand starts to *mean one consistent thing* again.

Five figures unpack what is moving:

| Figure | What it shows |
|---|---|
| **Signed coupling heatmap** | Which associations reinforce vs which pull against each other in the recovered J. |
| **Scenario metrics** | Overlap, frustration, and purchase probability across baseline → moderate → heavy. |
| **Pulse response** | Same field input → either fast buzz that decays *or* a residual memory tail. |
| **Hysteresis curve** | Brand state under increasing vs decreasing pressure are not the same path. |
| **Energy landscape** | Campaign field tilts the basin; *durable* impact deepens the target minimum. |

---

## The kernel, in one screen

```python
from brand_ising_spin_glass import (
    FEATURES, binarize_to_spins, corr_couplings, mi_couplings,
    memory_couplings, infer_mean_field_baseline,
    glauber_sample, memory_overlap, frustration_rate,
)

# 1. Spins from your panel
spins = binarize_to_spins(survey_df[FEATURES])

# 2. Couplings
J_sg = corr_couplings(spins, mode="spin_glass", scale=0.55)   # signed
J_mi = mi_couplings(spins, signed=True, scale=0.55)           # nonlinear

# 3. Plant the desired brand memory
target = np.array([1, 1, 1, 1, 1, -1, 1, 1, 1, -1])
J = J_sg + memory_couplings(target.reshape(1, -1), strength=0.35)

# 4. Field = baseline + campaign push
h0 = infer_mean_field_baseline(spins, J, beta=1.0)
h_campaign = h0 + spend * target

# 5. Sample, score
samples = glauber_sample(J, h_campaign, beta=1.0)
print(memory_overlap(samples, target), frustration_rate(samples, J))
```

The module is intentionally tiny (~250 LOC, NumPy + pandas). Everything else — figures, PDF, scenarios — sits on top.

---

## Repository layout

```
spinglass-marketing-exploration/
├── README.md
├── requirements.txt
├── .gitignore
├── assets/
│   └── banner.svg
├── brand_ising_spin_glass.py                  # the kernel
├── generate_spin_glass_marketing_report.py    # figures + PDF builder
├── docs/
│   └── spin_glass_brand_marketing_report.pdf  # 12-page technical brief
├── spin_glass_report_figures/                 # rendered PNGs (after running)
└── skills/                                    # LOCAL ONLY — gitignored
    ├── claude-mem/
    └── superpowers/
```

`skills/` is **excluded from git** via `.gitignore`. It exists only on the local clone for AI-assisted development and never leaves this machine.

---

## Use cases this framing unlocks

| Use case | Spin-glass measurement | Decision output |
|---|---|---|
| Campaign pretest | Target overlap `m_μ`, competitor overlap, response `R(t,t')` | Launch / revise cueing / raise media pressure |
| Brand-memory tracking | Rolling `J_ij`, frustration, largest eigenvalue, MI couplings | Find durable assets and weakening links |
| Competitive leakage | Overlap with competitor pattern, negative brand-link couplings | Rework distinctive assets and brand linkage |
| Promo vs equity tradeoff | Negative `J` between value and premium, preference hysteresis | Set promotion guardrails and recovery spend |
| Segment strategy | Segment-specific `J`, `h`, `q(T, T+δT)`, response half-life | Stable conversion segments vs memory-building segments |
| Launch tipping point | RFIM threshold, hysteresis width, basin depth | Minimum viable burst + maintenance spend |

The detailed math, formulas, and a full applied-use-cases section live in [the PDF brief](docs/spin_glass_brand_marketing_report.pdf).

---

## What this is not

- **Not a forecasting model.** It's diagnostic and structural. The "purchase probability" in the demo is a logit of overlap + consideration − competitor − frustration, calibrated on synthetic data, not a real MMM.
- **Not a replacement for brand-lift studies, MMM, or longitudinal tracking.** It's a *lens* you point at those inputs to read structure that single-KPI tables hide.
- **Not Ising-only.** The signed-correlation (spin-glass) view is the centerpiece — the Ising version is included as a synchronization benchmark, because suppressing the signs loses the most interesting marketing structure (the *tensions*).
- **Not yet calibrated to a real tracker.** All numbers in the demo come from a synthetic panel. Calibration to a real Brand Health Tracker wave is the natural next step.

---

## Source concepts the brief draws on

- Rolling Ising / spin-glass coupling matrices from correlation and mutual information *(stat-physics applied to interacting systems)*.
- Spin-glass models in economics as heterogeneous interacting agents *(disordered systems / quenched randomness)*.
- Neural-network memory as stable stored spin patterns *(Hopfield, Amit–Gutfreund–Sompolinsky)*.
- Aging, frustration, and dynamical mean-field concepts from spin-glass theory.

---

## Local development with AI skills

For AI-assisted development this project pulls in two skill libraries **locally**. They are never pushed:

```bash
# from repo root, after .gitignore is in place
mkdir -p skills
git clone https://github.com/thedotmack/claude-mem skills/claude-mem
git clone https://github.com/obra/superpowers     skills/superpowers
```

The `skills/` entry in `.gitignore` ensures these stay on your machine. Refer to each repo's own README for setup and usage; nothing in this project depends on them at runtime.

---

## Roadmap

- [ ] Calibrate the kernel against a real brand-tracker wave (binary pick-any data).
- [ ] Add the *non-equilibrium* response panel: two-time correlation `C(t, t_w)` and pulse `R(t, t')` from real campaign windows.
- [ ] Implement parameter-chaos overlap `q(T, T+δT)` as a stress-test panel.
- [ ] Random Field Ising (`η_i`) for explicit consumer heterogeneity.
- [ ] CLI: `spinglass simulate --tracker my.csv --pattern target.yml`.
- [ ] Bridge to [Brand Health Tracker](https://github.com/matiyashu/Brand-Health-Tracker---Mental-Availability-Physical-Availability) — feed its CBM linkage matrix in as the coupling estimator.

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  <sub>Spin-glass and Ising frames borrowed from statistical physics; brand health discipline borrowed from Ehrenberg-Bass.<br/>
  All errors of translation are mine.</sub>
</p>
