"""Spin-glass / Ising engine for brand-memory and campaign modeling.

Implements the math sketched in the companion PDF brief:
  - Binary spin states for brand associations (+/- 1)
  - Signed (spin-glass) and absolute (Ising) coupling estimators from data
  - Mutual-information signed couplings
  - Hopfield-style memory attractor couplings
  - Glauber MCMC sampler for E(s) = -1/2 sum_ij J_ij s_i s_j - sum_i h_i s_i
  - Mean-field h-baseline inference
  - Metrics: memory overlap, frustration

The module is intentionally small and dependency-light (numpy + pandas) so it
can be reused as a prototype kernel for tracker/campaign analyses.
"""
from __future__ import annotations

from typing import Iterable

import numpy as np
import pandas as pd


FEATURES: list[str] = [
    "ad_recall",
    "brand_link",
    "distinctive_asset",
    "trust",
    "value_for_money",
    "premium",
    "fun",
    "personal_relevance",
    "consideration",
    "competitor_salience",
]


# ---------------------------------------------------------------------------
# Basic utilities
# ---------------------------------------------------------------------------

def sigmoid(x: np.ndarray | float) -> np.ndarray | float:
    return 1.0 / (1.0 + np.exp(-x))


def binarize_to_spins(df: pd.DataFrame, threshold: float | None = None) -> np.ndarray:
    """Convert a numeric panel to +/-1 spins.

    Each column is centered at its median (or the supplied threshold) and
    mapped to +1 above and -1 at-or-below. Returns an (n_rows, n_cols) array.
    """
    arr = df.to_numpy(dtype=float)
    if threshold is None:
        center = np.median(arr, axis=0)
    else:
        center = np.full(arr.shape[1], threshold, dtype=float)
    spins = np.where(arr > center, 1.0, -1.0)
    return spins.astype(np.int8)


# ---------------------------------------------------------------------------
# Coupling estimators
# ---------------------------------------------------------------------------

def _safe_corr(spins: np.ndarray) -> np.ndarray:
    """Pearson correlation across spin columns; zero diagonal."""
    n_cols = spins.shape[1]
    if n_cols < 2:
        return np.zeros((n_cols, n_cols))
    corr = np.corrcoef(spins, rowvar=False)
    corr = np.nan_to_num(corr, nan=0.0)
    np.fill_diagonal(corr, 0.0)
    return corr


def corr_couplings(spins: np.ndarray, mode: str = "spin_glass", scale: float = 1.0) -> np.ndarray:
    """Pairwise couplings from spin correlations.

    mode='spin_glass' keeps the sign of the correlation (can be negative).
    mode='ising' uses |corr| as a non-negative synchronization benchmark.
    """
    corr = _safe_corr(spins)
    if mode == "ising":
        couplings = np.abs(corr)
    elif mode == "spin_glass":
        couplings = corr
    else:
        raise ValueError(f"unknown mode: {mode!r}")
    return scale * couplings


def _normalized_mi(x: np.ndarray, y: np.ndarray) -> float:
    """Normalized mutual information for two +/-1 vectors (range ~[0, 1])."""
    eps = 1e-12
    joint = np.zeros((2, 2))
    for xi, yi in zip(x, y):
        ix = 1 if xi > 0 else 0
        iy = 1 if yi > 0 else 0
        joint[ix, iy] += 1
    joint = joint / max(1.0, joint.sum())
    px = joint.sum(axis=1)
    py = joint.sum(axis=0)
    mi = 0.0
    for i in range(2):
        for j in range(2):
            p = joint[i, j]
            if p > eps:
                mi += p * np.log(p / max(eps, px[i] * py[j]))

    def _ent(p):
        return -np.sum([pi * np.log(pi) for pi in p if pi > eps])

    h_x = _ent(px)
    h_y = _ent(py)
    denom = max(eps, 0.5 * (h_x + h_y))
    return float(max(0.0, mi / denom))


def mi_couplings(spins: np.ndarray, signed: bool = True, scale: float = 1.0) -> np.ndarray:
    """Mutual-information couplings; optionally signed by Pearson correlation."""
    n_cols = spins.shape[1]
    couplings = np.zeros((n_cols, n_cols))
    corr = _safe_corr(spins) if signed else None
    for i in range(n_cols):
        for j in range(i + 1, n_cols):
            mi = _normalized_mi(spins[:, i], spins[:, j])
            sign = 1.0
            if signed and corr is not None:
                sign = np.sign(corr[i, j]) if corr[i, j] != 0 else 1.0
            couplings[i, j] = sign * mi
            couplings[j, i] = couplings[i, j]
    return scale * couplings


def memory_couplings(patterns: np.ndarray, strength: float = 1.0) -> np.ndarray:
    """Hopfield/Amit-style attractor couplings: J = (alpha/N) sum xi xi^T."""
    patterns = np.atleast_2d(patterns).astype(float)
    n_patterns, n_units = patterns.shape
    j = (strength / n_units) * (patterns.T @ patterns)
    np.fill_diagonal(j, 0.0)
    return j


# ---------------------------------------------------------------------------
# Mean-field baseline inference for h
# ---------------------------------------------------------------------------

def infer_mean_field_baseline(spins: np.ndarray, j: np.ndarray, beta: float = 1.0) -> np.ndarray:
    """Estimate per-feature baseline field h_i so the mean-field expectation
    matches the observed spin means.

      <s_i> = tanh(beta (h_i + sum_j J_ij <s_j>))
    => h_i = (1/beta) atanh(<s_i>) - sum_j J_ij <s_j>
    """
    m = np.clip(spins.mean(axis=0), -0.999, 0.999)
    return (np.arctanh(m) / beta) - j @ m


# ---------------------------------------------------------------------------
# Glauber MCMC sampler
# ---------------------------------------------------------------------------

def glauber_sample(
    j: np.ndarray,
    h: np.ndarray,
    beta: float = 1.0,
    n_steps: int = 40_000,
    burn_in: int = 8_000,
    sample_every: int = 20,
    seed: int | None = None,
    init: np.ndarray | None = None,
) -> np.ndarray:
    """Single-flip Glauber sampler.

    Returns an array of shape (n_samples, n_units) of +/-1 spins.
    """
    rng = np.random.default_rng(seed)
    n = j.shape[0]
    s = init.copy() if init is not None else rng.choice([-1, 1], size=n).astype(np.int8)
    samples: list[np.ndarray] = []
    for step in range(n_steps):
        i = rng.integers(0, n)
        local_field = h[i] + j[i] @ s
        p_up = float(sigmoid(2.0 * beta * local_field))
        s[i] = 1 if rng.random() < p_up else -1
        if step >= burn_in and (step - burn_in) % sample_every == 0:
            samples.append(s.copy())
    if not samples:
        samples.append(s.copy())
    return np.stack(samples).astype(np.int8)


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def memory_overlap(samples: np.ndarray, pattern: Iterable[int]) -> float:
    """m_mu = (1/N) sum_i xi_i <s_i>."""
    pattern_arr = np.asarray(list(pattern), dtype=float)
    if samples.ndim == 1:
        s_mean = samples.astype(float)
    else:
        s_mean = samples.astype(float).mean(axis=0)
    return float(np.mean(pattern_arr * s_mean))


def frustration_rate(samples: np.ndarray, j: np.ndarray) -> float:
    """Share of signed edges that are violated on average.

    An edge (i, j) is 'violated' when sign(<s_i s_j>) disagrees with sign(J_ij).
    Returns a value in [0, 1] over the off-diagonal edges with non-zero J.
    """
    if samples.ndim == 1:
        samples = samples[None, :]
    s = samples.astype(float)
    corr = (s.T @ s) / s.shape[0]
    np.fill_diagonal(corr, 0.0)
    mask = np.triu(np.abs(j) > 1e-9, k=1)
    if not mask.any():
        return 0.0
    sign_j = np.sign(j[mask])
    sign_c = np.sign(corr[mask])
    violated = (sign_j * sign_c) < 0
    return float(np.mean(violated))


__all__ = [
    "FEATURES",
    "sigmoid",
    "binarize_to_spins",
    "corr_couplings",
    "mi_couplings",
    "memory_couplings",
    "infer_mean_field_baseline",
    "glauber_sample",
    "memory_overlap",
    "frustration_rate",
]
