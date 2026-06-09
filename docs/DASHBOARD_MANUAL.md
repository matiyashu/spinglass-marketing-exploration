# Spin-Glass Brand Memory & Campaign Dynamics — Program Manual

A complete guide to the V3 dashboard: every feature, the formula behind it, how to
read its results, and what you can do with it.

> **One-line mental model.** Each brand association (trust, premium, value, …) is a
> magnetic *spin* that points up (+1, held) or down (−1, not held). Associations that
> tend to be held together have a **positive coupling**; associations that exclude each
> other have a **negative coupling** (a *tension*). A campaign is an **external field**
> that pushes some spins. The dashboard estimates this coupling structure from survey
> data and lets you diagnose, compare and simulate it.

---

## Table of contents

1. [Core concepts](#1-core-concepts)
2. [The interface: context bar, workspaces, badges](#2-the-interface)
3. [The ten association features](#3-the-ten-association-features)
4. [Workspace](#4-workspace) — Home · Data setup · Import & validation · Method status
5. [Brand portfolio](#5-brand-portfolio) — Portfolio · Memory map · Tensions · Competitive leakage
6. [Product / vertical](#6-product--vertical) — Vertical overview · Product memory fit · Segment differences · Switching risk
7. [Campaigns](#7-campaigns) — Overview · Creative memory · Field response · Simulator · Validation
8. [Dynamics & stability](#8-dynamics--stability) — Rolling regime · Persistence · Replica/fragmentation · Stress test
9. [Reports & Methods](#9-reports--methods)
10. [Use cases](#10-use-cases)
11. [Formula reference](#11-formula-reference)
12. [Data schema](#12-data-schema)

---

## 1. Core concepts

| Marketing object | Spin-glass object | In the app |
|---|---|---|
| Brand association held / not held | spin `sᵢ ∈ {−1, +1}` | one of the 10 features |
| Two associations reinforce | positive coupling `Jᵢⱼ > 0` | teal cell in the memory map |
| Two associations conflict | negative coupling `Jᵢⱼ < 0` | red cell — a *tension* |
| A campaign / media push | external field `hᵢ(t)` | campaign pressure |
| A creative's intended memory | Hopfield pattern `ξ` | creative memory map |
| Market noise level | temperature `T = 1/β` | a simulation knob |
| Brand-memory retrieval | overlap `m = (1/N) Σ ξᵢ sᵢ` | target overlap |
| Fragmented meaning | frustration: violated signed edges | tensions / frustration |

**How a spin is read from a survey row.** Binary questions (e.g. *ad recall*: yes/no) map
`1 → +1`, `0 → −1`. Likert questions (1–5) are split at the median (or top-box): at-or-above
→ `+1`, below → `−1`. This is `binarize_to_spins`.

**How couplings are estimated.** For a chosen slice of respondents we stack their spin
vectors and compute the correlation matrix. The **signed** correlation is the spin-glass
coupling `J`; its absolute value `|corr|` is the Ising synchronisation benchmark. This is
descriptive — it *measures* co-movement, it does not assume a generative model.

---

## 2. The interface

### Context bar (top of every page)
Five dropdowns — **Brand · Product · Market · Segment · Campaign**. Your selection is a
global filter: every chart recomputes for exactly that slice. Narrowing the context (e.g.
adding a segment) gives a cleaner, more homogeneous coupling structure; widening it pools
more respondents. Breadcrumbs under the bar show where you are.

### Workspaces (sidebar, bottom-left)
- **Demo** — reads pre-computed JSON bundled in the app. Instant, no backend.
- **Live** — sends the context to the FastAPI service, which computes the same numbers from
  the raw panel on the fly. Demo and Live agree to machine precision because both call the
  same `marketing_kernel`.

### The two badges on every chart
- **Scientific status** — `measured` (from data) · `simulation` (from declared parameters) ·
  `illustrative` (mathematical form only) · `experimental` (unvalidated heuristic, e.g.
  signed MI).
- **Data sufficiency** — whether the *currently supplied data* enables a method. This is why
  Observed Validation is greyed out until you provide outcome data, and why there is **no
  purchase-probability forecast** anywhere until a validated outcome model exists.

---

## 3. The ten association features

| Feature | Group | Encoding | Plain meaning |
|---|---|---|---|
| ad_recall | Awareness | binary | Remembers seeing the advertising |
| brand_link | Linkage | binary | Correctly links the ad to the brand |
| distinctive_asset | Linkage | binary | Recognises a logo / colour / character |
| trust | Meaning | Likert | Sees the brand as dependable |
| value_for_money | Meaning | Likert | Sees fair value at the price |
| premium | Meaning | Likert | Sees the brand as upscale |
| fun | Meaning | Likert | Brand evokes enjoyment / energy |
| personal_relevance | Relevance | Likert | "For people like me" |
| consideration | Funnel | binary | Would consider buying next time |
| competitor_salience | Competition | binary | A competitor is top-of-mind |

Groups are used for colour-coding and for reading clusters in the memory map.

---

## 4. Workspace

### 4.1 Home
**Answers:** what is the state of the selected brand right now?
**How it works:** loads the coupling summary for the active context and the portfolio summary
for all brands.
**KPI tiles (and their formulas):**
- **Memory synchronization** = `λ_max` — the largest eigenvalue of the signed coupling matrix.
  High = associations move as one bloc.
- **Association coherence** = mean of the upper-triangle signed couplings.
- **Meaning diversity** = negative-edge share = fraction of association pairs with `Jᵢⱼ < 0`.
- **Memory rigidity** = `(1/N) Σᵢ ⟨sᵢ⟩²` (a labelled *proxy*, see §8.3).

**How to read it:** a healthy brand shows a clear `λ_max` lift *with* a non-zero meaning
diversity — coherent but not collapsed. The portfolio bars rank brands by synchronisation;
click a brand to make it the context. The method badges below show what the data unlocks.
**Use it when:** opening a review, or orienting before a deep dive.

### 4.2 Data setup
**Answers:** what data feeds the workbench and what does each table unlock?
**How it works:** lists the five tables (tracker, campaigns, creative map, outcomes,
competitor) and queries Method status to mark each loaded / not loaded.
**How to read it:** the *four data roles* box is the key idea — tracker associations are
**state variables**; spend/reach are **external fields**; sales/ROAS are **outcomes**;
competitor spend is **context**. Performance metrics (CTR, CPC, CPA) shape the field or
validate outcomes — they are never used directly as couplings.
**Use it when:** onboarding a new dataset, or explaining why a method is disabled.

### 4.3 Import & validation
**Answers:** is my CSV usable?
**How it works:** client-side parse + checks (required feature columns present, row count,
context columns, missing-value rate). In Live mode the same checks run server-side
(`/data/validate`).
**How to read it:** green = ready, amber = caveat, red = blocking. A missing feature column
or too few rows blocks import.
**Use it when:** bringing your own tracker before switching to the Live workspace.

### 4.4 Method status
**Answers:** which analyses can I run with the data I have?
**How it works:** each method declares required tables; it is **enabled** only if all are
present (`method_status`).
**How to read it:** "Outcome calibration — missing outcomes" is the honest signal that you
cannot yet make calibrated claims. Nothing computes a forecast around a missing requirement.
**Use it when:** scoping an engagement, or auditing what a result is allowed to claim.

---

## 5. Brand portfolio

### 5.1 Portfolio overview
**Answers:** which brand has the most coherent / fragmented / leak-prone memory?
**Formula:** per brand, the static summary — `λ_max`, mean signed coupling, negative-edge
share, and rigidity proxy.
**How to read it:** longer bar = more synchronised memory. Compare rigidity (polarised
means) and tension share side by side. Click a brand to focus the whole app on it.
**Use it when:** portfolio reviews, deciding which brand needs structural work.

### 5.2 Brand memory map ★ (the centrepiece)
**Answers:** what does this brand mean, and which associations reinforce vs conflict?
**How it works:** the 10×10 coupling matrix for the context, in three views you toggle:
- **Signed** `Jᵢⱼ = corr(sᵢ, sⱼ)` — direction preserved (teal +, red −). *measured*
- **|corr|** `|corr(sᵢ, sⱼ)|` — synchronisation strength, sign discarded. *measured*
- **MI** — mutual information `I(sᵢ;sⱼ) = Σ p(x,y) log[p(x,y)/p(x)p(y)]`, quantile-binned,
  normalised to its max. Catches nonlinear dependence. *experimental* (signing MI is a
  heuristic).

**How to read it:** look for **teal clusters** (associations that travel together — what the
brand owns) and **red cells**, especially around `competitor_salience` (what opposes the
brand). The two side lists rank the strongest reinforcing and conflicting pairs. The diagonal
is always zero. Narrow the context to a segment to watch the structure change.
**Use it when:** defining brand strategy, finding load-bearing vs redundant associations,
briefing creative on what to protect.

### 5.3 Brand tensions
**Answers:** which contradictions pull the brand apart?
**How it works:** two views.
- **Strongest tensions** — the most negative couplings.
- **Frustrated triads** — triangles `(i, j, k)` where `sign(Jᵢⱼ·Jⱼₖ·Jᵢₖ) < 0` (an odd number
  of negative edges) **and** all three `|J| ≥ 0.12`. The guardrail stops near-zero noise from
  being reported as strategy.

**How to read it:** a frustrated triad (e.g. *value · premium · trust*) cannot be satisfied
at once — pushing one association strains another. "No triads pass the guardrail" is a valid,
healthy result, not an error.
**Use it when:** diagnosing a muddled positioning, or pre-empting a repositioning's side
effects.

### 5.4 Competitive leakage
**Answers:** how much does the brand's memory overlap a competitor pattern, over time?
**Formula:** per wave, `competitor_overlap = mean( s · ξ_competitor / N )`; `leak_share =
share of respondents with positive overlap`.
**How to read it:** a rising line means the *category*, not the brand, is owning the moment —
high switching exposure. Treat the competitor as an opposing field, not a coupling.
**Use it when:** defending share, timing distinctiveness work against competitor pressure.

---

## 6. Product / vertical

### 6.1 Vertical overview
**Answers:** how coherent is each product's memory, grouped by vertical?
**Formula:** per product, the static summary + rigidity + competitor overlap.
**How to read it:** a product whose `λ_max` / rigidity diverges from its siblings is either a
distinctive hero or a dilution risk. Click a product to focus the app.
**Use it when:** portfolio architecture, deciding which products carry the master brand.

### 6.2 Product memory fit
**Answers:** is each product's memory consistent with the master brand?
**Formula:** product-level `λ_max` (memory synchronisation), bar per product.
**How to read it:** far below siblings = weakly-linked / fragmented memory; far above = a
distinctive sub-brand. The active product is highlighted.
**Use it when:** range reviews, sub-brand vs master-brand decisions.

### 6.3 Segment differences
**Answers:** do audiences hold the same brand memory or fragment?
**Formula:** the **segment overlap matrix** — cosine overlap of each pair of segments' mean
spin vectors, `overlap(a,b) = (v̄ₐ · v̄_b)/(‖v̄ₐ‖‖v̄_b‖)`.
**How to read it:** off-diagonal near 1 = a shared memory (one creative travels); lower
values = a segment that needs its own creative. Per-segment coherence is listed below; click
to focus a segment.
**Use it when:** audience strategy, deciding where a single message works vs where to
diverge.

### 6.4 Switching risk
**Answers:** which products are most exposed to competitor salience?
**Formula:** per-product competitor overlap (see 5.4), ranked.
**How to read it:** higher overlap = more substitutable in memory = a defensive priority.
This is a measured leakage signal, **not** a churn forecast.
**Use it when:** prioritising defensive spend across a range.

---

## 7. Campaigns

> Campaigns separate **declared-field simulation** (always available) from **observed
> validation** (only with outcome data). Pick a campaign in the context bar first.

### 7.1 Campaign overview
**Answers:** which campaigns exist, and which carry outcome data?
**How to read it:** each card shows the flight window and an *outcomes / no-outcomes* tag.
Selecting a campaign also sets its product as context.

### 7.2 Creative memory pattern
**Answers:** what memory was the creative *meant* to activate? — *illustrative* (declared, not
measured).
**Formula:** the creative map `a_{c,i} = target_spin × intended_strength` per feature.
**How to read it:** green bars are associations the creative pushes up, red down; bar length
is intended strength; the evidence source (strategy / copy test) is shown.
**Use it when:** documenting creative intent before measuring what actually happened.

### 7.3 Field response ★
**Answers:** which associations actually moved while the campaign ran?
**Formula:** mean spin per association **during − pre** the flight, computed on the campaign's
*targeted market + segment* (where the field is strongest). Target overlap is scored on the
features the creative actually targets: `overlap = mean( s[:,targeted] · sign(ξ_targeted) /
|targeted| )`.
**How to read it:** the KPI strip shows pre → during overlap and the **lift**. The waterfall
shows per-association movement (teal rose, red fell). A campaign can lift its intended
associations, do nothing on an already-saturated audience, or only raise category salience —
all are real outcomes the chart will show honestly.
**Use it when:** post-flight read, judging whether a campaign built the intended memory.

### 7.4 Scenario simulator — *simulation*
**Answers:** if we push this creative pattern harder, what equilibrium appears?
**Formula:** add the creative as a Hopfield term `J' = J_sg + memory_couplings(ξ)`, raise the
field with spend `h = h₀ + spend·ξ`, sample with Glauber, read target overlap, competitor
overlap, frustration, rigidity at each spend level.
**How to read it:** target overlap should rise and frustration fall as spend grows.
**Deliberately no purchase-probability card** — this is a simulation from declared parameters,
not a forecast.
**Use it when:** pre-flight what-ifs, comparing the coherence of two creative patterns.

### 7.5 Observed validation
**Answers:** did the campaign's movement track real outcomes? — only enabled with outcome data.
**How it works:** plots the campaign's outcome series (brand lift, ROAS). When outcomes are
absent it shows an explicit *disabled* state rather than a synthetic stand-in.
**How to read it:** this is the only place calibrated outcome claims belong. No outcomes →
no claim.
**Use it when:** closing the loop between memory movement and business results.

---

## 8. Dynamics & stability

### 8.1 Rolling regime
**Answers:** how does brand-memory coherence evolve wave over wave?
**Formula:** rolling windows of 6 monthly waves, stepped 1; each window's summary (avg signed
coupling, avg |corr|, avg MI, `λ_max`, tension share). Campaign flights are shaded.
**How to read it:** when synchronisation and `λ_max` rise together while tension share falls,
the brand's associations are collapsing into one aligned state — often during a campaign
flight, then relaxing after. This is the measured signature of a field acting on memory.
**Use it when:** tracking structural change across a year, attributing shifts to flights.

### 8.2 Memory persistence
**Answers:** how much campaign lift survived after the flight?
**Formula:** residue ratio `(post − pre) / (during − pre)` of target overlap per campaign.
**How to read it:** near 100% = durable memory; near 0% = buzz that decayed; negative = it
fully reverted. Measured from post-campaign waves, not assumed.
**Use it when:** distinguishing brand-building from disposable activation.

### 8.3 Replica / fragmentation
**Answers:** does the brand have competing memory states, and are the estimates stable?
**Two separate panels — the discipline matters:**
- **Estimation-stability P(q)** — *measured*. Bootstrap-resample respondents, recompute
  couplings, overlap the (normalised) upper-triangle vectors. Concentrated near 1 = the
  coupling structure is robust to sampling.
- **Landscape P(q)** — *simulation*. Run independent Glauber chains under one fixed `J, h, β`;
  overlap their final states `q_ab = (1/N) Σᵢ sᵢ^a sᵢ^b`. Broad / multimodal = the declared
  landscape supports competing states.

**How to read it:** never conflate the two. In a finite brand panel a broad `P(q)` is a
*descriptive* "competing meanings" signal — **not** proof of replica-symmetry breaking. The
**rigidity** tile is `(1/N) Σ ⟨sᵢ⟩²`, labelled a *proxy*, not the Edwards-Anderson order
parameter.
**Use it when:** judging whether a finding is solid (estimation) and whether the brand's
meaning is singular or contested (landscape).

### 8.4 Stress test · campaign sensitivity
**Answers:** which associations are easiest to move? — *simulation*.
**Formula:** susceptibility `χᵢ = d⟨sᵢ⟩ / dhᵢ`, computed numerically by nudging each feature's
field and resampling.
**How to read it:** high `χ` = a movable lever spend can shift; low `χ` = entrenched or
disconnected. Full parameter-chaos robustness (overlap under market shocks) is an extension
on top of this.
**Use it when:** allocating spend to where it has leverage, not where memory is already fixed.

---

## 9. Reports & Methods

- **Executive report** — a context-scoped one-screen summary (KPIs, what the brand owns,
  tensions to resolve, leakage). Print / export to PDF with the Print button.
- **Technical appendix** — every formula with its scientific status and current method
  availability.
- **Model glossary** — plain-language definition + status badge for each quantity.
- **Theory explainers** — the illustrative energy-landscape / hysteresis / pulse figures,
  clearly marked as mathematical intuition, not measurements.
- **Paper benchmark** — the original commodity rolling-couplings workflow, hidden unless
  `NEXT_PUBLIC_SHOW_METHOD_BENCHMARK=true`; kept as the methodology reference the marketing
  translation is built on.

---

## 10. Use cases

| Goal | Path through the dashboard | What you get |
|---|---|---|
| **Brand strategy / positioning** | Memory map → Tensions | The associations the brand owns, and the contradictions to resolve |
| **Creative brief** | Memory map (protect the teal cluster) → Creative memory pattern | Which associations to reinforce vs which tensions to avoid triggering |
| **Campaign pre-test** | Scenario simulator across spend levels | Simulated target retrieval & frustration before committing budget |
| **Campaign post-mortem** | Field response → Persistence | What actually moved, and whether it lasted |
| **Media-effectiveness validation** | Observed validation (with outcomes) | Whether memory movement tracked brand lift / ROAS |
| **Audience strategy** | Segment differences → Memory map per segment | Where one message works vs where audiences diverge |
| **Portfolio architecture** | Portfolio overview → Vertical overview → Product memory fit | Which brands/products are coherent, distinctive or diluting |
| **Competitive defence** | Competitive leakage → Switching risk | Where the category is winning the moment; most substitutable products |
| **Spend allocation** | Stress test (susceptibility) | The movable associations where spend has leverage |
| **Robustness / confidence** | Replica / fragmentation (estimation panel) | Whether a finding survives resampling before you act on it |
| **Exec readout** | Executive report (Print) | A context-scoped, science-labelled one-pager |

**Worked example — "Did our premium push work for Aurora?"**
1. Context bar: Brand = Aurora, Campaign = the premium campaign (sets its product).
2. *Creative memory pattern* — confirm the creative targeted premium↑, trust↑, value↓.
3. *Field response* — read the during−pre lift and the waterfall: did premium/trust actually
   rise on the targeted segment?
4. *Persistence* — did the lift survive after the flight?
5. *Observed validation* — if outcomes exist, did it track brand lift / ROAS?
6. *Executive report* — print the context-scoped summary for the readout.

---

## 11. Formula reference

| Quantity | Formula | Status |
|---|---|---|
| Spin encoding | binary `1→+1, 0→−1`; Likert split at median/top-box | measured |
| Coupling (spin-glass) | `Jᵢⱼ = corr(sᵢ, sⱼ)`, `Jᵢᵢ = 0` | measured |
| Ising benchmark | `Jᵢⱼ^Ising = |corr(sᵢ, sⱼ)|` | measured |
| Mutual information | `I(sᵢ;sⱼ) = Σ p(x,y) log[p(x,y)/p(x)p(y)]`, quantile bins, ÷max | experimental |
| Memory synchronization | `λ_max` = largest eigenvalue of `J` | measured |
| Association coherence | mean of upper-triangle `Jᵢⱼ` | measured |
| Meaning diversity | negative-edge share = `mean(Jᵢⱼ < 0)` | measured |
| Memory term (Hopfield) | `J^mem = (ξᵀξ)/N`, diag 0 | illustrative |
| Glauber update | `P(flip) = 1 / (1 + exp(β·2sᵢ(hᵢ + Σⱼ Jᵢⱼsⱼ)))` | simulation |
| Mean-field baseline field | `h = arctanh(⟨s⟩)/β − J⟨s⟩` | measured |
| Target overlap | `m = (1/N)⟨ s · ξ ⟩` | simulation |
| Frustration | share of edges with `sign(Jᵢⱼ)·sᵢ·sⱼ < 0` | simulation |
| Frustrated triad | `sign(Jᵢⱼ·Jⱼₖ·Jᵢₖ) < 0`, all `|J| ≥ 0.12` | measured |
| Competitive leakage | `(1/N)⟨ s · ξ_comp ⟩` per wave | measured |
| Segment overlap | cosine of per-segment mean spin vectors | measured |
| Rigidity proxy | `(1/N) Σᵢ ⟨sᵢ⟩²` (NOT the EA order parameter) | measured |
| Overlap distribution | `q_ab = (1/N) Σ sᵢ^a sᵢ^b`; `P(q)` | landscape: simulation · bootstrap: measured |
| Susceptibility | `χᵢ = d⟨sᵢ⟩/dhᵢ` (numerical) | simulation |
| Campaign pressure | `w·z(log(1+spend)) + …` ; `hᵢ(t) = hᵢ⁰ + pressure·aᵢ` | illustrative |
| Persistence residue | `(post − pre)/(during − pre)` of target overlap | measured |

---

## 12. Data schema

The bundled demo dataset (`backend/sample_data/v3_marketing/`):
**2 brands × 3 products × 2 verticals × 3 markets × 4 segments × 24 monthly waves × 6
campaigns**, with *partial* outcomes.

| File | Grain | Key columns |
|---|---|---|
| `brand_tracker_panel.csv` | respondent × wave | brand_id, product_id, vertical_id, market, segment, + 10 features |
| `product_catalog.csv` | product | brand_id, vertical_id, price_tier, target_segment |
| `campaign_calendar.csv` | campaign × wave | creative_id, channel, market, segment, spend, reach, frequency |
| `creative_memory_map.csv` | creative × feature | target_spin (−1/+1), intended_strength (0–1), evidence_source |
| `competitor_context.csv` | market × vertical × wave | competitor_spend, share_of_voice, category_demand |
| `outcomes_partial.csv` | campaign × wave | conversions, cvr, cpa, revenue, roas, brand_lift *(some campaigns only)* |
| `expected_outputs/*.csv` | — | QA targets the live endpoints reproduce to machine precision |

To use your own data: match the tracker schema (the 10 feature columns + context columns),
validate it under *Import & validation*, then switch to the **Live** workspace. Methods light
up as you add the campaign, creative-map and outcome tables.

---

*This manual documents behaviour as built in `backend/marketing_kernel.py` and the V3
dashboard. Measured quantities are descriptive estimates from data; simulation quantities come
from declared parameters; nothing here is a forecast unless validated against real outcomes.*
