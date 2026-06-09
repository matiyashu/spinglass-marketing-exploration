"""Capture dashboard screenshots for the Word manual.

Drives the *installed* Google Chrome via Playwright (no browser download).
Requires the frontend dev server on http://localhost:3760.

Run:  python backend/scripts/capture_dashboard_screens.py
"""
from __future__ import annotations

from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://localhost:3760"
OUT = Path(__file__).resolve().parents[2] / "assets" / "manual"
OUT.mkdir(parents=True, exist_ok=True)

BASE_CTX = {
    "brand_id": "brand_a", "product_id": None, "vertical_id": None,
    "market": None, "segment": None, "campaign_id": None,
}
# C002 = Aurora Protein Bar, gen_z fun/relevance push, has outcomes, clean lift.
CAMPAIGN_CTX = {**BASE_CTX, "product_id": "aurora_protein_bar", "campaign_id": "C002"}

SHOTS = [
    ("01_landing", "/", None),
    ("02_home", "/dashboard", BASE_CTX),
    ("03_data_setup", "/dashboard/data", BASE_CTX),
    ("04_method_status", "/dashboard/method-status", BASE_CTX),
    ("05_portfolio", "/dashboard/brands", BASE_CTX),
    ("06_memory_map", "/dashboard/brands/memory-map", BASE_CTX),
    ("07_tensions", "/dashboard/brands/tensions", BASE_CTX),
    ("08_competitive_leakage", "/dashboard/brands/competitive-leakage", BASE_CTX),
    ("09_vertical_overview", "/dashboard/verticals", BASE_CTX),
    ("10_product_memory_fit", "/dashboard/verticals/product-memory-fit", BASE_CTX),
    ("11_segment_differences", "/dashboard/verticals/segment-differences", BASE_CTX),
    ("12_switching_risk", "/dashboard/verticals/switching-risk", BASE_CTX),
    ("13_rolling_regime", "/dashboard/dynamics/rolling-regime", BASE_CTX),
    ("14_replicas", "/dashboard/dynamics/replicas", BASE_CTX),
    ("15_persistence", "/dashboard/dynamics/persistence", BASE_CTX),
    ("16_stress_test", "/dashboard/dynamics/stress-test", BASE_CTX),
    ("17_campaign_overview", "/dashboard/campaigns", CAMPAIGN_CTX),
    ("18_creative_memory", "/dashboard/campaigns/creative-memory", CAMPAIGN_CTX),
    ("19_field_response", "/dashboard/campaigns/field-response", CAMPAIGN_CTX),
    ("20_simulator", "/dashboard/campaigns/simulator", CAMPAIGN_CTX),
    ("21_validation", "/dashboard/campaigns/validation", CAMPAIGN_CTX),
    ("22_exec_report", "/dashboard/reports/executive", BASE_CTX),
    ("23_glossary", "/dashboard/methods/glossary", BASE_CTX),
]


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        ctx = browser.new_context(viewport={"width": 1480, "height": 1320}, device_scale_factor=2)
        page = ctx.new_page()

        # Establish the origin, then seed workspace = demo.
        page.goto(f"{BASE}/dashboard", wait_until="domcontentloaded")
        page.evaluate("() => localStorage.setItem('spinglass.workspace', 'demo')")

        for name, path, context in SHOTS:
            if context is not None:
                page.evaluate("(c) => localStorage.setItem('spinglass.context', JSON.stringify(c))", context)
            try:
                # networkidle never fires under Next dev (HMR websocket); use load.
                page.goto(f"{BASE}{path}", wait_until="domcontentloaded", timeout=20000)
            except Exception as exc:
                print(f"  ! goto {name}: {exc}")
            page.wait_for_timeout(2600)  # let fetches + Recharts settle
            try:
                page.wait_for_selector("h1", timeout=4000)
            except Exception:
                pass
            full = name in ("01_landing", "06_memory_map", "14_replicas", "22_exec_report")
            page.screenshot(path=str(OUT / f"{name}.png"), full_page=full)
            print(f"  captured {name}")

        browser.close()
    print(f"done -> {OUT}")


if __name__ == "__main__":
    main()
