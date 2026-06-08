# V2 Scientific Alignment Plan

## Purpose

V2 should turn this repository from a polished exploration into a scientifically
defensible research dashboard. The core rule is simple:

> The dashboard may only present a result as "computed" when it is actually
> computed from uploaded or bundled data. Theory-only shapes must move to an
> explainer area and be clearly labeled as illustrative.

This plan separates three layers:

1. **Paper-aligned physics layer**: rolling correlation, signed spin-glass
   couplings, Ising benchmark couplings, mutual information, spectral
   diagnostics, and rolling-window regime summaries. This is directly aligned
   with the commodity-market paper workflow.
2. **Equilibrium Ising / spin-glass simulation layer**: Hamiltonian, external
   fields, Glauber sampling, memory overlap, and frustration. This is valid as a
   simulation model when the couplings and fields are explicitly stated.
3. **Marketing application layer**: campaign and brand-memory interpretation.
   This layer must be marked as an application hypothesis until calibrated on a
   real brand tracker and validated against outcomes.

## Remove Or Downgrade In V2

The following elements should be removed from the main analytical dashboard or
demoted to clearly labeled theory explainers until implemented with real data.

| Current element | V2 action | Reason |
|---|---|---|
| Synthetic purchase probability | Remove from headline KPI unless outcome data is supplied | Current formula is hand-built and not calibrated. |
| Synthetic pulse response curve | Move to theory explainer | It is not estimated from campaign time windows. |
| Synthetic hysteresis curve | Move to theory explainer | It is a tanh illustration, not a Random Field Ising measurement. |
| Synthetic energy landscape chart | Move to theory explainer | It is an illustrative potential, not inferred from observed free energy. |
| Parameter chaos claims | Hide from computed dashboard until overlap under perturbation is implemented | Currently a roadmap concept. |
| Aging / two-time correlation claims | Hide until longitudinal data support `C(t,t_w)` | Requires real time-indexed observations. |
| Signed mutual information as primary spin-glass coupling | Mark experimental or use MI as unsigned dependence | MI is non-negative; multiplying by correlation sign is a heuristic. |
| "Predict campaign" language | Replace with "simulate", "diagnose", or "stress-test" | Prediction requires out-of-sample validation. |

## Keep In Main V2 Dashboard

These are scientifically acceptable if implemented transparently.

| Metric or view | Scientific status | Required data |
|---|---|---|
| Signed correlation coupling `J_ij = corr(r_i,r_j)` | Paper-aligned descriptive coupling | Time-series returns or spin panel |
| Ising benchmark `J_ij = abs(corr_ij)` | Paper-aligned synchronization benchmark | Same as above |
| Mutual information matrix | Paper-aligned nonlinear dependence measure | Time-series returns or spin panel |
| Rolling average coupling | Paper-aligned regime indicator | Time-indexed data and rolling window |
| Largest eigenvalue | Paper-aligned synchronization indicator | Coupling matrix |
| Frustration rate | Valid spin-glass diagnostic when `J` is signed | Signed coupling matrix and sampled/observed states |
| Memory overlap | Valid Hopfield/attractor diagnostic when target pattern is declared | Spin states and target pattern |
| Glauber simulation | Valid simulation, not empirical proof | Declared `J`, `h`, `beta`, burn-in, seed |
| Baseline field inference | Mean-field approximation | Observed spin means and chosen `J` |

## V2 Model Tiers

### Tier 1: Paper-Aligned Descriptive Couplings

This tier should be the default scientific demo because it is closest to the
commodity-market paper.

Inputs:

- `date`
- asset price or return columns
- optional asset group metadata

Core computations:

```text
r_i(t) = log(P_i(t)) - log(P_i(t-1))
C_ij(t; w) = corr(r_i[t-w+1:t], r_j[t-w+1:t])
J_ij^SG(t) = C_ij(t; w)
J_ij^Ising(t) = |C_ij(t; w)|
MI_ij(t; w) = sum_x sum_y p(x,y) log[p(x,y)/(p(x)p(y))]
```

Dashboard outputs:

- rolling signed-correlation heatmap
- rolling Ising heatmap
- MI heatmap
- average coupling
- largest eigenvalue
- signed-edge share
- sector-level summaries

### Tier 2: Equilibrium Simulation

This tier is valid as simulation, not empirical proof.

Inputs:

- coupling matrix `J`
- baseline field `h`
- temperature `T` or `beta`
- target memory pattern `xi`

Core computations:

```text
E(s;t) = -1/2 * sum_{i != j} J_ij s_i s_j - sum_i h_i(t)s_i
Delta E_i = 2 s_i [h_i + sum_j J_ij s_j]
P(flip s_i) = 1 / (1 + exp(beta * Delta E_i))
m_xi = (1/N) * sum_i xi_i s_i
```

Dashboard outputs:

- simulated state distribution
- target-memory overlap
- competitor-pattern overlap
- frustration rate
- convergence diagnostics: burn-in, sample count, acceptance rate

### Tier 3: Marketing Causal Or Predictive Layer

This tier should remain disabled unless real campaign and outcome data are
provided.

Required data:

- campaign dates and spend/pressure by channel
- longitudinal brand tracker waves
- outcome data such as sales, conversion, search, consideration, or brand lift
- competitor and macro controls

Allowed claims after validation:

- calibrated association between overlap/frustration and outcome
- out-of-sample performance
- observed response half-life
- observed memory residue

Disallowed without validation:

- "this predicts sales"
- "this proves long-term impact"
- "this estimates true causality"

## Live Dashboard Computation Requirements

The V2 dashboard should compute from uploaded data through the backend. Static
demo JSON may remain only for "Demo Mode" and must be labeled synthetic.

### Backend Endpoints

| Endpoint | Status for V2 | Purpose |
|---|---|---|
| `POST /validate` | required | Validate schema, missingness, variance, date continuity, sample size |
| `POST /couplings/rolling` | required | Compute rolling `J^SG`, `J^Ising`, MI, average coupling, eigenvalue |
| `POST /couplings/static` | required | Compute full-sample matrices |
| `POST /simulate/equilibrium` | required | Run Glauber simulation from declared `J`, `h`, `beta`, target pattern |
| `POST /patterns/overlap` | required | Compute overlap against declared target/competitor patterns |
| `POST /response/observed` | optional | Estimate observed pulse response from campaign windows |
| `POST /outcome/calibrate` | optional | Fit outcome model only when outcomes are supplied |
| `POST /report` | optional | Generate a report from actual computed outputs |

### Frontend Rules

- Demo mode: may use bundled synthetic files.
- Live mode: must call the backend and show only outputs computed from the
  user's data.
- If backend is unavailable, live analysis panels should show a disabled state,
  not synthetic results.
- Each chart should show a scientific status badge:
  - **Measured from data**
  - **Simulation from declared parameters**
  - **Illustrative theory**
  - **Experimental heuristic**

## V2 Data Contracts

### Paper-Aligned Commodity Demo

Use this dataset to demonstrate the physics workflow.

Files created in `backend/sample_data/`:

- `commodity_paper_aligned_prices.csv`
- `commodity_paper_aligned_returns.csv`
- `commodity_paper_aligned_spins.csv`
- `commodity_groups.csv`

These are synthetic, reproducible commodity-like series inspired by the
commodity system in the paper: precious metals, energy, industrial metals,
grains, and soft commodities. They are not downloaded market data and must not
be presented as empirical Yahoo Finance data.

### Marketing Application Demo

Use this dataset only for the applied brand-memory workflow.

Files created in `backend/sample_data/`:

- `brand_tracker_v2_demo.csv`
- `campaign_calendar_v2_demo.csv`
- `target_memory_patterns_v2.csv`

These files are synthetic application data. They are useful for testing the live
API path and dashboard controls, but not for proving marketing effectiveness.

## V2 Implementation Tasks

### Phase 1: Clean Scientific Framing

- Replace all headline synthetic purchase-probability cards with overlap,
  coupling, and frustration metrics.
- Move pulse, hysteresis, energy landscape, and parameter-chaos visuals into a
  theory explainer tab unless they are computed from data.
- Add scientific status badges to every chart.
- Update README language from "predict" to "simulate / diagnose" unless a
  validated outcome model is present.

### Phase 2: Paper-Aligned Live Computation

- Add parser for price time series.
- Compute log returns.
- Add rolling window settings: default `w = 90`, `step = 30`.
- Compute rolling signed correlation, Ising absolute correlation, and MI.
- Compute rolling average coupling and largest eigenvalue.
- Add bootstrap confidence intervals for MI and average coupling.
- Add tests for zero diagonal, symmetry, and window counts.

### Phase 3: Simulation Engine Hardening

- Add explicit Hamiltonian function.
- Track Glauber acceptance rate.
- Add burn-in and convergence diagnostics.
- Separate observed states from simulated states.
- Let user choose whether `J` comes from correlation proxy or inverse-Ising fit.

### Phase 4: More Rigorous Coupling Estimation

- Add inverse-Ising pseudolikelihood estimation as an optional estimator.
- Use regularized logistic regression per spin:

```text
P(s_i = 1 | s_-i) = sigmoid(2 beta [h_i + sum_{j != i} J_ij s_j])
```

- Symmetrize the resulting `J`.
- Compare pseudolikelihood `J` with correlation-proxy `J`.

### Phase 5: Marketing Validation

- Add campaign calendar ingestion.
- Estimate observed response only when dates and campaign windows exist.
- Add outcome calibration only when outcome columns exist.
- Report out-of-sample validation metrics before enabling predictive claims.

## Acceptance Criteria

V2 is scientifically aligned when:

1. A user can upload `commodity_paper_aligned_prices.csv` and reproduce
   rolling couplings, MI, average coupling, and eigenvalue.
2. The dashboard never presents synthetic curves as measured results.
3. Every output has a scientific status badge.
4. The brand demo is clearly labeled synthetic application data.
5. The backend computes live matrices and simulations from uploaded rows.
6. Tests confirm coupling symmetry, zero diagonal, Hamiltonian sign convention,
   and Glauber flip behavior.
7. Predictive or causal claims are disabled unless outcome validation exists.

