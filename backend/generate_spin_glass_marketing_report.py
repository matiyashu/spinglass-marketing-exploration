"""Builds the spin-glass / Ising brand-marketing PDF brief.

Run:
    python generate_spin_glass_marketing_report.py

Outputs:
    spin_glass_brand_marketing_report.pdf
    spin_glass_report_figures/*.png
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image as PILImage
from PIL import ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from brand_ising_spin_glass import (
    FEATURES,
    corr_couplings,
    frustration_rate,
    glauber_sample,
    infer_mean_field_baseline,
    memory_couplings,
    memory_overlap,
    sigmoid,
)


ROOT = Path(__file__).resolve().parent
DOCS_DIR = ROOT / "docs"
DOCS_DIR.mkdir(exist_ok=True)
OUT = DOCS_DIR / "spin_glass_brand_marketing_report.pdf"
FIG_DIR = ROOT / "spin_glass_report_figures"
FIG_DIR.mkdir(exist_ok=True)


PALETTE = {
    "ink": (33, 37, 41),
    "muted": (95, 105, 118),
    "blue": (31, 111, 235),
    "teal": (18, 138, 126),
    "orange": (221, 132, 69),
    "red": (194, 65, 65),
    "green": (57, 145, 92),
    "grid": (218, 224, 232),
    "paper": (255, 255, 255),
    "soft": (245, 248, 252),
}


def font(size: int, bold: bool = False):
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def draw_axes(draw, box, x_ticks, y_ticks, y_format="{:.1f}"):
    x0, y0, x1, y1 = box
    draw.rectangle([x0, y0, x1, y1], fill=PALETTE["paper"], outline=PALETTE["grid"], width=1)
    for value in y_ticks:
        py = y1 - (value - min(y_ticks)) / (max(y_ticks) - min(y_ticks)) * (y1 - y0)
        draw.line([x0, py, x1, py], fill=PALETTE["grid"], width=1)
        draw.text((x0 - 44, py - 8), y_format.format(value), fill=PALETTE["muted"], font=font(20))
    for label, px in x_ticks:
        draw.line([px, y1, px, y1 + 6], fill=PALETTE["grid"], width=1)
        draw.text((px - 35, y1 + 12), label, fill=PALETTE["muted"], font=font(19))


def line_chart(path, title, series, x_labels, y_min, y_max, y_ticks, caption=None, y_format="{:.1f}"):
    w, h = 1500, 850
    img = PILImage.new("RGB", (w, h), PALETTE["paper"])
    draw = ImageDraw.Draw(img)
    draw.text((60, 42), title, fill=PALETTE["ink"], font=font(42, bold=True))
    if caption:
        draw.text((60, 96), caption, fill=PALETTE["muted"], font=font(24))

    box = (130, 155, w - 95, h - 135)
    x0, y0, x1, y1 = box
    n_points = max(len(values) for _label, values, _color in series)
    xs = np.linspace(x0, x1, n_points)
    tick_positions = xs if len(x_labels) == n_points else np.linspace(x0, x1, len(x_labels))
    draw_axes(draw, box, list(zip(x_labels, tick_positions)), y_ticks, y_format=y_format)

    def point(idx, value):
        return xs[idx], y1 - (value - y_min) / (y_max - y_min) * (y1 - y0)

    for _label, values, color in series:
        pts = [point(i, v) for i, v in enumerate(values)]
        for a, b in zip(pts[:-1], pts[1:]):
            draw.line([a, b], fill=color, width=6)
        for px, py in pts:
            draw.ellipse([px - 11, py - 11, px + 11, py + 11], fill=color, outline=PALETTE["paper"], width=3)

    lx, ly = 130, h - 80
    for label, _values, color in series:
        draw.line([lx, ly, lx + 45, ly], fill=color, width=7)
        draw.text((lx + 56, ly - 14), label, fill=PALETTE["ink"], font=font(22))
        lx += 310
    img.save(path)


def heatmap(path, title, labels, matrix):
    w, h = 1450, 980
    img = PILImage.new("RGB", (w, h), PALETTE["paper"])
    draw = ImageDraw.Draw(img)
    draw.text((55, 38), title, fill=PALETTE["ink"], font=font(42, bold=True))
    draw.text(
        (55, 92),
        "Blue = reinforcing association, red = tension or competitive relationship",
        fill=PALETTE["muted"],
        font=font(24),
    )
    n = len(labels)
    x0, y0, cell = 310, 170, 58
    vmax = max(0.01, float(np.max(np.abs(matrix))))
    for i, label in enumerate(labels):
        draw.text((35, y0 + i * cell + 16), label.replace("_", " "), fill=PALETTE["ink"], font=font(17))
        draw.text((x0 + i * cell + 4, 140), str(i + 1), fill=PALETTE["muted"], font=font(18))
    for i in range(n):
        for j in range(n):
            val = float(matrix[i, j])
            intensity = min(1.0, abs(val) / vmax)
            base = np.array(PALETTE["blue"]) if val >= 0 else np.array(PALETTE["red"])
            rgb = tuple(np.round((1 - intensity) * 245 + intensity * base).astype(int))
            rect = [x0 + j * cell, y0 + i * cell, x0 + (j + 1) * cell - 2, y0 + (i + 1) * cell - 2]
            draw.rectangle(rect, fill=rgb, outline=(235, 238, 242))
    draw.text(
        (x0, y0 + n * cell + 32),
        "Numbers across the top map to the same feature order shown on the left.",
        fill=PALETTE["muted"],
        font=font(21),
    )
    img.save(path)


def response_chart(path):
    t = np.arange(0, 61)
    pulse = np.where((t >= 8) & (t <= 18), 1.0, 0.0)
    short = np.zeros_like(t, dtype=float)
    long = np.zeros_like(t, dtype=float)
    for i, ti in enumerate(t):
        if ti < 8:
            short[i] = 0.05
            long[i] = 0.05
        elif ti <= 18:
            short[i] = 0.05 + 0.75 * (1 - math.exp(-(ti - 8) / 2.2))
            long[i] = 0.05 + 0.55 * (1 - math.exp(-(ti - 8) / 5.0))
        else:
            short[i] = 0.05 + 0.75 * math.exp(-(ti - 18) / 5.0)
            long[i] = 0.25 + 0.35 * math.exp(-(ti - 18) / 28.0)
    series = [
        ("short-term buzz", short.tolist(), PALETTE["orange"]),
        ("long-term memory", long.tolist(), PALETTE["teal"]),
        ("campaign pulse", (0.05 + pulse * 0.9).tolist(), PALETTE["blue"]),
    ]
    line_chart(
        path,
        "Pulse response: fast decay vs memory residue",
        series,
        ["0", "10", "20", "30", "40", "50", "60"],
        0,
        1,
        [0.0, 0.25, 0.5, 0.75, 1.0],
        "The same campaign field can produce either temporary response or persistent state change.",
    )


def hysteresis_chart(path):
    hvals = np.linspace(-1.0, 1.0, 80)
    up = np.tanh(3.2 * (hvals - 0.23))
    down = np.tanh(3.2 * (hvals + 0.23))
    w, h = 1400, 820
    img = PILImage.new("RGB", (w, h), PALETTE["paper"])
    draw = ImageDraw.Draw(img)
    draw.text((60, 42), "Hysteresis: impact depends on path, not only spend level", fill=PALETTE["ink"], font=font(40, bold=True))
    draw.text(
        (60, 95),
        "Increasing and decreasing marketing pressure can produce different market states.",
        fill=PALETTE["muted"],
        font=font(24),
    )
    box = (130, 160, w - 95, h - 125)
    x0, y0, x1, y1 = box
    draw.rectangle([x0, y0, x1, y1], fill=PALETTE["paper"], outline=PALETTE["grid"])
    for yv in [-1, -0.5, 0, 0.5, 1]:
        py = y1 - (yv + 1) / 2 * (y1 - y0)
        draw.line([x0, py, x1, py], fill=PALETTE["grid"])
        draw.text((x0 - 54, py - 10), f"{yv:.1f}", fill=PALETTE["muted"], font=font(20))
    for xv in [-1, -0.5, 0, 0.5, 1]:
        px = x0 + (xv + 1) / 2 * (x1 - x0)
        draw.line([px, y0, px, y1], fill=PALETTE["grid"])
        draw.text((px - 22, y1 + 12), f"{xv:.1f}", fill=PALETTE["muted"], font=font(20))

    def map_pt(xv, yv):
        return x0 + (xv + 1) / 2 * (x1 - x0), y1 - (yv + 1) / 2 * (y1 - y0)

    up_pts = [map_pt(x, y) for x, y in zip(hvals, up)]
    down_pts = [map_pt(x, y) for x, y in zip(hvals, down)]
    for a, b in zip(up_pts[:-1], up_pts[1:]):
        draw.line([a, b], fill=PALETTE["blue"], width=6)
    for a, b in zip(down_pts[:-1], down_pts[1:]):
        draw.line([a, b], fill=PALETTE["red"], width=6)
    draw.text((x0 + 20, y0 + 18), "M: aggregate brand state", fill=PALETTE["muted"], font=font(22))
    draw.text((x1 - 390, y1 + 52), "H: marketing field / pressure", fill=PALETTE["muted"], font=font(22))
    draw.line([x0 + 70, y1 + 76, x0 + 120, y1 + 76], fill=PALETTE["blue"], width=7)
    draw.text((x0 + 130, y1 + 62), "increasing pressure", fill=PALETTE["ink"], font=font(21))
    draw.line([x0 + 370, y1 + 76, x0 + 420, y1 + 76], fill=PALETTE["red"], width=7)
    draw.text((x0 + 430, y1 + 62), "decreasing pressure", fill=PALETTE["ink"], font=font(21))
    img.save(path)


def energy_landscape_chart(path):
    x = np.linspace(-1, 1, 140)
    baseline = 1.4 * (x + 0.15) ** 4 - 1.0 * (x + 0.15) ** 2 + 0.10 * x + 0.25
    campaign = baseline - 0.55 * x
    memory = 1.35 * (x - 0.38) ** 4 - 1.03 * (x - 0.38) ** 2 - 0.22 * x + 0.05
    all_y = np.concatenate([baseline, campaign, memory])
    ymin, ymax = float(all_y.min() - 0.05), float(all_y.max() + 0.12)
    w, h = 1450, 820
    img = PILImage.new("RGB", (w, h), PALETTE["paper"])
    draw = ImageDraw.Draw(img)
    draw.text((60, 42), "Energy landscape: from temporary field to new memory basin", fill=PALETTE["ink"], font=font(40, bold=True))
    draw.text(
        (60, 95),
        "A successful long-term campaign deepens the desired brand-memory minimum.",
        fill=PALETTE["muted"],
        font=font(24),
    )
    box = (130, 155, w - 95, h - 135)
    x0, y0, x1, y1 = box
    draw.rectangle([x0, y0, x1, y1], fill=PALETTE["paper"], outline=PALETTE["grid"])
    for y_frac in np.linspace(0, 1, 5):
        py = y0 + y_frac * (y1 - y0)
        draw.line([x0, py, x1, py], fill=PALETTE["grid"])
    for xv, label in [(-1, "competitor"), (0, "neutral"), (1, "target")]:
        px = x0 + (xv + 1) / 2 * (x1 - x0)
        draw.line([px, y0, px, y1], fill=PALETTE["grid"])
        draw.text((px - 45, y1 + 14), label, fill=PALETTE["muted"], font=font(20))

    def map_pt(xv, yv):
        return x0 + (xv + 1) / 2 * (x1 - x0), y1 - (yv - ymin) / (ymax - ymin) * (y1 - y0)

    for _name, y, color in [
        ("baseline landscape", baseline, PALETTE["muted"]),
        ("during campaign field", campaign, PALETTE["orange"]),
        ("after memory reinforcement", memory, PALETTE["teal"]),
    ]:
        pts = [map_pt(a, b) for a, b in zip(x, y)]
        for a, b in zip(pts[:-1], pts[1:]):
            draw.line([a, b], fill=color, width=5)
    lx, ly = x0 + 25, y0 + 20
    for label, color in [
        ("baseline landscape", PALETTE["muted"]),
        ("during campaign field", PALETTE["orange"]),
        ("after memory reinforcement", PALETTE["teal"]),
    ]:
        draw.line([lx, ly, lx + 45, ly], fill=color, width=7)
        draw.text((lx + 56, ly - 14), label, fill=PALETTE["ink"], font=font(21))
        ly += 36
    img.save(path)


def run_scenario():
    rng = np.random.default_rng(42)
    target_pattern = np.array([1, 1, 1, 1, 1, -1, 1, 1, 1, -1])
    competitor_pattern = np.array([-1, -1, -1, -1, -1, 1, -1, -1, -1, 1])
    j_true = memory_couplings(np.vstack([target_pattern, competitor_pattern]), strength=0.32)
    tensions = {
        ("value_for_money", "premium"): -0.35,
        ("fun", "trust"): -0.12,
        ("brand_link", "competitor_salience"): -0.36,
        ("consideration", "competitor_salience"): -0.30,
        ("trust", "consideration"): 0.25,
    }
    for (a, b), value in tensions.items():
        ia, ib = FEATURES.index(a), FEATURES.index(b)
        j_true[ia, ib] = j_true[ib, ia] = value
    baseline_h = np.array([-0.35, -0.30, -0.10, 0.02, 0.04, -0.03, -0.02, -0.15, -0.25, 0.10])
    observed_panel = glauber_sample(j_true, baseline_h, beta=0.70, n_steps=120_000, burn_in=20_000, sample_every=40, seed=11)
    j_spin_glass = corr_couplings(observed_panel, mode="spin_glass", scale=0.55)
    h0 = infer_mean_field_baseline(observed_panel, j_spin_glass, beta=1.0)
    j_campaign = j_spin_glass + memory_couplings(target_pattern.reshape(1, -1), strength=0.18)

    rows = []
    for name, spend in [("baseline", 0.00), ("moderate", 0.22), ("heavy", 0.45)]:
        h_campaign = h0 + spend * target_pattern + rng.normal(0.0, 0.03, size=len(FEATURES))
        samples = glauber_sample(j_campaign, h_campaign, beta=1.0, n_steps=60_000, burn_in=12_000, sample_every=40, seed=int(1000 * spend + 5))
        target = memory_overlap(samples, target_pattern)
        competitor = memory_overlap(samples, competitor_pattern)
        mean_consideration = float(samples[:, FEATURES.index("consideration")].mean())
        frustration = frustration_rate(samples, j_campaign)
        logit_purchase = -0.35 + 1.60 * target + 0.90 * mean_consideration - 0.75 * competitor - 0.80 * frustration
        rows.append(
            {
                "scenario": name,
                "target_memory_overlap": target,
                "competitor_overlap": competitor,
                "consideration_spin": mean_consideration,
                "purchase_probability": float(sigmoid(logit_purchase)),
                "frustration": frustration,
            }
        )
    return pd.DataFrame(rows), j_spin_glass


def scenario_chart(path, results):
    labels = results["scenario"].tolist()
    series = [
        ("target memory overlap", results["target_memory_overlap"].tolist(), PALETTE["teal"]),
        ("purchase probability", results["purchase_probability"].tolist(), PALETTE["blue"]),
        ("frustration", results["frustration"].tolist(), PALETTE["red"]),
    ]
    line_chart(
        path,
        "Simulated campaign impact on brand-memory state",
        series,
        labels,
        -0.35,
        1,
        [-0.25, 0.0, 0.25, 0.5, 0.75, 1.0],
        "Synthetic tracker example using signed couplings plus a target memory attractor.",
        y_format="{:.2f}",
    )


def add_page_number(canvas, _doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6b7280"))
    canvas.drawRightString(7.5 * inch, 0.45 * inch, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()


def make_styles():
    base = getSampleStyleSheet()
    return {
        "Title": ParagraphStyle("TitleCustom", parent=base["Title"], fontName="Helvetica-Bold", fontSize=25, leading=30, alignment=TA_LEFT, textColor=colors.HexColor("#1f2937"), spaceAfter=14),
        "Subtitle": ParagraphStyle("SubtitleCustom", parent=base["BodyText"], fontName="Helvetica", fontSize=11.5, leading=16, textColor=colors.HexColor("#4b5563"), spaceAfter=18),
        "H1": ParagraphStyle("H1", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=colors.HexColor("#1f2937"), spaceBefore=16, spaceAfter=8),
        "H2": ParagraphStyle("H2", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=colors.HexColor("#264653"), spaceBefore=10, spaceAfter=5),
        "Body": ParagraphStyle("BodyCustom", parent=base["BodyText"], fontName="Helvetica", fontSize=9.6, leading=13.4, textColor=colors.HexColor("#24292f"), spaceAfter=6),
        "Small": ParagraphStyle("Small", parent=base["BodyText"], fontName="Helvetica", fontSize=8.2, leading=11, textColor=colors.HexColor("#4b5563")),
        "Caption": ParagraphStyle("Caption", parent=base["BodyText"], fontName="Helvetica-Oblique", fontSize=8.2, leading=10.5, textColor=colors.HexColor("#6b7280"), spaceBefore=3, spaceAfter=7),
        "Formula": ParagraphStyle("Formula", parent=base["Code"], fontName="Courier", fontSize=8.2, leading=10.5, textColor=colors.HexColor("#111827"), leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=6),
    }


def bullets(items, styles):
    return ListFlowable(
        [ListItem(Paragraph(item, styles["Body"]), leftIndent=12) for item in items],
        bulletType="bullet",
        leftIndent=14,
        bulletFontName="Helvetica",
        bulletFontSize=8,
    )


def formula(text, styles):
    table = Table([[Preformatted(text, styles["Formula"])]], colWidths=[6.35 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f3f6fa")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#d8dee8")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def small_table(data, col_widths, header=True):
    table = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
    style = [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("LEADING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d9e0ea")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        style.extend(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eaf1f8")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
            ]
        )
    for r in range(1 if header else 0, len(data)):
        if r % 2 == 0:
            style.append(("BACKGROUND", (0, r), (-1, r), colors.HexColor("#fafbfd")))
    table.setStyle(TableStyle(style))
    return table


def image_block(path, width, caption, styles):
    pil = PILImage.open(path)
    return KeepTogether(
        [
            Image(str(path), width=width, height=width * pil.height / pil.width),
            Paragraph(caption, styles["Caption"]),
        ]
    )


def build_pdf(results, j_spin_glass, figures):
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        rightMargin=0.72 * inch,
        leftMargin=0.72 * inch,
        topMargin=0.70 * inch,
        bottomMargin=0.62 * inch,
        title="Spin-Glass and Ising Models for Brand Memory and Campaign Measurement",
    )
    story = []

    story.append(Paragraph("Spin-Glass and Ising Models for Brand Memory and Campaign Measurement", styles["Title"]))
    story.append(Paragraph("A practical modeling brief for using statistical-physics ideas to predict campaign response, brand behavior, and durable memory formation.", styles["Subtitle"]))
    story.append(
        small_table(
            [
                ["Prepared artifact", "PDF technical brief with formulas, sample simulation graphs, use cases, and Python implementation notes"],
                ["Core analogy", "Consumers or brand associations are spins; campaigns are external fields; memory is an attractor in the energy landscape"],
                ["Primary outputs", "Short-term response, memory overlap, frustration, hysteresis, parameter-chaos stability, and KPI probability"],
            ],
            [1.45 * inch, 4.85 * inch],
            header=False,
        )
    )
    story.append(Spacer(1, 10))
    story.append(Paragraph("Executive Summary", styles["H1"]))
    story.append(Paragraph("Spin-glass physics gives marketers a language for moving beyond isolated KPI lift. The method represents a market as many interacting binary states. Some states reinforce each other, some conflict, and campaigns act as temporary or persistent fields that push the system toward a desired brand-memory pattern.", styles["Body"]))
    story.append(
        bullets(
            [
                "<b>Ising model:</b> best used as a synchronization benchmark. It answers: how strongly do brand associations move together?",
                "<b>Spin-glass model:</b> best used for contradiction and heterogeneity. It answers: where do brand meanings compete, fragment, or leak to competitors?",
                "<b>Hopfield / Amit memory layer:</b> stores desired brand patterns as attractors. It answers: does a campaign retrieve the intended memory?",
                "<b>Non-equilibrium dynamics:</b> separates short-term buzz from long-term memory by tracking response, decay, hysteresis, and aging.",
            ],
            styles,
        )
    )
    story.append(Paragraph("Source Concepts Used", styles["H2"]))
    story.append(Paragraph("The report adapts four source ideas: rolling Ising/spin-glass coupling matrices from correlation and mutual information; spin-glass economics as heterogeneous interacting agents; neural-network memory as stable stored spin patterns; and aging, frustration, and dynamical mean-field concepts from spin-glass theory.", styles["Body"]))

    story.append(PageBreak())
    story.append(Paragraph("1. Modeling Brand Memory as a Spin System", styles["H1"]))
    story.append(Paragraph("Let each variable be a consumer state, a brand association, or a memory trace. A spin of +1 means the state is active, endorsed, remembered, or chosen. A spin of -1 means the opposite. A full consumer or market state is the vector s.", styles["Body"]))
    story.append(formula("""s_i in {-1, +1}

Examples:
  s_ad_recall = +1      respondent remembers the ad
  s_brand_link = +1     memory is correctly linked to the brand
  s_competitor = +1     competitor is salient
  s_consider = +1       respondent is in the consideration set""", styles))
    story.append(Paragraph("Energy Landscape", styles["H2"]))
    story.append(Paragraph("The market is represented as an energy landscape. States with lower energy are more likely. Campaigns do not simply add lift; they reshape the landscape by making some combinations easier to reach and others harder to sustain.", styles["Body"]))
    story.append(formula("""E(s; t) = -1/2 * sum_{i != j} J_ij s_i s_j - sum_i h_i(t) s_i

J_ij     pairwise coupling between brand states
h_i(t)   external field: media pressure, creative cue, price incentive, distribution, PR
beta     inverse market noise, beta = 1 / T
T        temperature: volatility, category turbulence, consumer randomness""", styles))
    story.append(Paragraph("Ising vs. Spin Glass", styles["H2"]))
    story.append(formula("""Ising benchmark:
  J_ij^Ising = |corr(x_i, x_j)|

Spin-glass representation:
  J_ij^SG = corr(x_i, x_j)

Nonlinear dependence option:
  MI(X, Y) = sum_x sum_y p(x,y) log[p(x,y) / (p(x)p(y))]
  J_ij^MI-SG = sign(corr_ij) * normalized_MI_ij""", styles))
    story.append(Paragraph("The Ising version measures total coherence. The spin-glass version preserves negative relationships: premium vs value, brand link vs competitor salience, or fun vs trust if a category contains that tension.", styles["Body"]))
    story.append(image_block(figures["heatmap"], 6.2 * inch, "Figure 1. Example signed coupling matrix estimated from synthetic brand-tracking spins.", styles))

    story.append(PageBreak())
    story.append(Paragraph("2. Campaign as External Field and Memory Attractor", styles["H1"]))
    story.append(Paragraph("A campaign can be modeled in two ways. First, as an external field h(t) that temporarily increases the probability of selected states. Second, as a memory attractor that strengthens a desired pattern in the coupling matrix.", styles["Body"]))
    story.append(Paragraph("External Field", styles["H2"]))
    story.append(formula("""h_i(t) = h_i^baseline + media_spend(t) * creative_fit_i + promo_i(t)

P(s_i = +1 | s_-i) = sigmoid(2 beta [h_i(t) + sum_j J_ij s_j])""", styles))
    story.append(Paragraph("Memory Attractor", styles["H2"]))
    story.append(Paragraph("The Amit-Gutfreund-Sompolinsky / Hopfield interpretation stores a desired brand-memory pattern xi as an attractor. If the campaign works, noisy consumer states fall toward that attractor even after the external field fades.", styles["Body"]))
    story.append(formula("""J_ij^memory = (alpha / N) * sum_mu xi_i^mu xi_j^mu,  i != j

Memory retrieval / brand-fit score:
  m_mu(t) = (1/N) * sum_i xi_i^mu s_i(t)

m_mu near +1   desired brand memory retrieved
m_mu near  0   weak or fragmented retrieval
m_mu near -1   opposite or competitor-like pattern""", styles))
    scenario_table = [["Scenario", "Target overlap", "Competitor overlap", "Consideration", "Purchase prob.", "Frustration"]]
    for row in results.to_dict("records"):
        scenario_table.append(
            [
                row["scenario"],
                f"{row['target_memory_overlap']:.3f}",
                f"{row['competitor_overlap']:.3f}",
                f"{row['consideration_spin']:.3f}",
                f"{row['purchase_probability']:.3f}",
                f"{row['frustration']:.3f}",
            ]
        )
    story.append(small_table(scenario_table, [0.9 * inch, 1.05 * inch, 1.05 * inch, 1.0 * inch, 1.05 * inch, 0.95 * inch]))
    story.append(Spacer(1, 7))
    story.append(image_block(figures["scenario"], 6.2 * inch, "Figure 2. Simulated impact increases target-memory overlap and purchase probability while reducing frustration.", styles))

    story.append(PageBreak())
    story.append(Paragraph("3. Short-Term vs Long-Term Marketing Impact", styles["H1"]))
    story.append(Paragraph("The short-term/long-term distinction is a non-equilibrium dynamics question. A purely short-term campaign perturbs the market and then decays back to baseline. A long-term campaign changes which states are stable and leaves a residue in memory, preference, or social reinforcement.", styles["Body"]))
    story.append(image_block(figures["response"], 6.2 * inch, "Figure 3. A pulse campaign can generate fast response only, or response plus persistent memory residue.", styles))
    story.append(Paragraph("Short-Term Impact: Fast Regime", styles["H2"]))
    story.append(formula("""Pulse response:
  R_i(t, t') = partial <s_i(t)> / partial h_i(t')
  R_M(t, t') = partial <M(t)> / partial H(t')

Aggregate state:
  M(t) = (1/N) * sum_i s_i(t)

Short-term signature:
  C(t, t') = C(t - t') and R(t, t') = R(t - t')
  response half-life is short after h(t') is removed""", styles))
    story.append(Paragraph("In marketing terms, this is buzz, promo response, search lift, or social chatter that equilibrates quickly. The key metrics are peak response, incremental area under the response curve, decay half-life, and return-to-baseline time.", styles["Body"]))
    story.append(Paragraph("Long-Term Impact: Slow Regime, Aging, and Memory", styles["H2"]))
    story.append(formula("""Two-time correlation:
  C(t, t_w) = (1/N) * sum_i <s_i(t) s_i(t_w)>

Aging form:
  C(t, t_w) = C_fast(t - t_w) + C_slow(t / t_w)

Long-term signature:
  the decay depends on waiting time t_w
  the market does not fully return to the old baseline""", styles))
    story.append(Paragraph("Long-term marketing impact looks like aging: the system's future response depends on the history of prior exposure. Brand preference, memory structures, distinctive asset linkage, and social proof become part of the slow state variables.", styles["Body"]))

    story.append(PageBreak())
    story.append(Paragraph("4. Hysteresis, Tipping Points, and Quenched Disorder", styles["H1"]))
    story.append(image_block(figures["hysteresis"], 6.2 * inch, "Figure 4. Hysteresis means market state depends on whether pressure is rising or falling.", styles))
    story.append(Paragraph("A Random Field Ising Model adds consumer-level heterogeneity. Some people are easier to move than others, and some resist the campaign even under high pressure.", styles["Body"]))
    story.append(formula("""Random-field brand model:
  E(s; t) = -sum_{i<j} J_ij s_i s_j - sum_i [H(t) + eta_i] s_i

H(t)    common marketing pressure
eta_i   consumer heterogeneity: prior belief, income, need state, category habit""", styles))
    story.append(
        bullets(
            [
                "<b>Hysteresis:</b> the brand state under decreasing spend can remain stronger than it was under increasing spend at the same spend level.",
                "<b>Tipping point:</b> once enough consumers or associations switch, social reinforcement and memory couplings make the new state self-sustaining.",
                "<b>Quenched disorder:</b> a successful campaign changes durable structure, not just momentary activation. In practice this appears as changed couplings J_ij, stronger brand-link paths, or lower competitor leakage.",
            ],
            styles,
        )
    )
    story.append(image_block(figures["energy"], 6.2 * inch, "Figure 5. A campaign can tilt the landscape temporarily; durable impact deepens the target memory basin.", styles))

    story.append(PageBreak())
    story.append(Paragraph("5. Measuring Parameter Chaos and Impact Stability", styles["H1"]))
    story.append(Paragraph("Spin-glass systems can be fragile. A small change in temperature, market noise, macro conditions, or category context can reorder the preferred states. This is useful for measuring whether brand impact will survive a new economic climate.", styles["Body"]))
    story.append(formula("""Overlap under market-condition shift:
  q(T, T + dT) = (1/N) * sum_i s_i^*(T) s_i^*(T + dT)

Interpretation:
  q near 1     campaign impact is stable across conditions
  q near 0     impact is fragile; the market may settle into another state
  q below 0    impact reverses or activates a competitor/opposite pattern""", styles))
    story.append(Paragraph("Marketing Interpretation", styles["H2"]))
    story.append(
        bullets(
            [
                "Stress-test campaigns across inflation, competitor attack, promotion cuts, channel disruption, and category-news shocks.",
                "Run the model at multiple temperatures T. Higher T means more volatility and weaker predictable memory retrieval.",
                "Track whether the same target-memory overlap survives or collapses under small parameter shifts.",
                "Use low-overlap cases to identify fragile assets, overfit creative cues, or segments requiring reinforcement.",
            ],
            styles,
        )
    )
    story.append(Paragraph("Dynamical Mean-Field Approximation", styles["H2"]))
    story.append(Paragraph("For larger systems, individual interactions can be coarsened into mean fields. This is the practical role of DMFT-style thinking: model the evolving average state without simulating every micro-interaction in full detail.", styles["Body"]))
    story.append(formula("""Mean-field update sketch:
  m_i(t + 1) = tanh(beta [h_i(t) + sum_j J_ij m_j(t) - correction_i(t)])

Campaign question:
  Which shocks dissipate, and which shocks move m(t) into a new persistent regime?""", styles))

    story.append(PageBreak())
    story.append(Paragraph("6. Applied Use Cases", styles["H1"]))
    use_cases = [
        ["Use case", "Business question", "Spin-glass measurement", "Decision output"],
        ["Campaign pretest", "Will this creative produce the intended brand memory?", "Target overlap m_mu, competitor overlap, immediate R(t,t')", "Launch, revise cueing, or adjust media pressure."],
        ["Brand-memory tracking", "Is the brand becoming more coherent or fragmented?", "Rolling J_ij, frustration, largest eigenvalue, MI couplings", "Find durable assets and weakening associations."],
        ["Competitive leakage", "Does the ad make people remember the category or a rival?", "Overlap with competitor pattern and negative brand-link couplings", "Rework distinctive assets and brand linkage."],
        ["Promo vs equity tradeoff", "Does short-term sales lift damage premium memory?", "Negative J between value and premium, hysteresis of preference", "Set promotion guardrails and recovery spend."],
        ["Segment strategy", "Which audiences are stable, movable, or chaotic?", "Segment-specific J, h, q(T,T+dT), response half-life", "Allocate spend to stable conversion or memory-building segments."],
        ["Launch tipping point", "How much pressure is needed for self-sustaining adoption?", "RFIM threshold, hysteresis width, basin depth", "Estimate minimum viable burst and maintenance spend."],
    ]
    story.append(small_table(use_cases, [1.05 * inch, 1.7 * inch, 2.0 * inch, 1.55 * inch]))
    story.append(Paragraph("Short vs Long-Term Measurement Table", styles["H2"]))
    story.append(
        small_table(
            [
                ["Feature", "Short-term impact", "Long-term impact"],
                ["Dynamical regime", "Fast regime; rapid equilibration", "Slow regime; aging dynamics"],
                ["Main tool", "Response function R(t,t')", "Two-time correlation C(t,t_w)"],
                ["Landscape effect", "Temporary spin shift", "New or deeper stable local minimum"],
                ["Statistical signal", "TTI approximately holds", "FDT/TTI violations and memory residue"],
                ["Consumer analogy", "Buzz, trend, promo lift", "Preference, loyalty, distinctive memory"],
            ],
            [1.25 * inch, 2.45 * inch, 2.45 * inch],
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("7. Implementation Blueprint", styles["H1"]))
    story.append(
        bullets(
            [
                "<b>Step 1: Define spins.</b> Convert survey, search, social, CRM, or purchase variables into +1/-1 states.",
                "<b>Step 2: Estimate couplings.</b> Use signed correlations for spin glass, absolute correlations for Ising, and MI for nonlinear dependence.",
                "<b>Step 3: Define the desired memory.</b> Encode the strategic brand pattern xi: the associations that should be active or inactive.",
                "<b>Step 4: Model the campaign field.</b> Map media, creative assets, spend, price, distribution, and PR into h_i(t).",
                "<b>Step 5: Simulate dynamics.</b> Use Glauber sampling or mean-field updates under baseline and campaign scenarios.",
                "<b>Step 6: Validate externally.</b> Link overlap, frustration, and response metrics to sales lift, conversion, brand lift, retention, or choice data.",
            ],
            styles,
        )
    )
    story.append(Paragraph("Minimal Python Pattern", styles["H2"]))
    story.append(formula("""survey = pd.read_csv("brand_tracker.csv")
spins = binarize_to_spins(survey[FEATURES])

J_sg = corr_couplings(spins, mode="spin_glass", scale=0.55)
J_mi = mi_couplings(spins, signed=True, scale=0.55)

target = np.array([1, 1, 1, 1, 1, -1, 1, 1, 1, -1])
J = J_sg + memory_couplings(target.reshape(1, -1), strength=0.35)

h_campaign = h_baseline + spend * target
samples = glauber_sample(J, h_campaign, beta=1.0)
score = memory_overlap(samples, target)""", styles))
    story.append(Paragraph("Key Metrics to Report", styles["H2"]))
    metrics = [
        ["Metric", "Formula / proxy", "Marketing meaning"],
        ["Target memory overlap", "m_mu = (1/N) sum_i xi_i s_i", "Whether the intended brand memory is retrieved"],
        ["Frustration", "share of violated signed edges", "Contradiction or fragmented meaning"],
        ["Pulse response", "R(t,t') = partial <M(t)> / partial H(t')", "Incremental short-term lift"],
        ["Memory residue", "M(t+L) - M_baseline after field removal", "Long-term brand effect"],
        ["Hysteresis width", "H_up threshold minus H_down threshold", "Stickiness of the new state"],
        ["Parameter-chaos overlap", "q(T,T+dT)", "Stability under market volatility"],
    ]
    story.append(small_table(metrics, [1.5 * inch, 2.0 * inch, 2.8 * inch]))
    story.append(Paragraph("Cautions", styles["H2"]))
    story.append(Paragraph("This framework is diagnostic and simulation-based. It should be calibrated with experiments, brand-lift studies, MMM, conversion data, or longitudinal tracking. The model is strongest when used to compare scenarios and uncover structure, not as a stand-alone oracle.", styles["Body"]))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Local Python Asset", styles["H2"]))
    story.append(Paragraph("The companion prototype in this workspace is brand_ising_spin_glass.py. It contains the synthetic simulation, coupling estimators, memory-attractor logic, Glauber sampler, and scenario metrics used to build the sample figures.", styles["Body"]))

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)


def main():
    results, j_spin_glass = run_scenario()
    figures = {
        "scenario": FIG_DIR / "scenario_metrics.png",
        "heatmap": FIG_DIR / "signed_coupling_heatmap.png",
        "response": FIG_DIR / "pulse_response.png",
        "hysteresis": FIG_DIR / "hysteresis.png",
        "energy": FIG_DIR / "energy_landscape.png",
    }
    scenario_chart(figures["scenario"], results)
    heatmap(figures["heatmap"], "Signed coupling heatmap: brand associations", FEATURES, j_spin_glass)
    response_chart(figures["response"])
    hysteresis_chart(figures["hysteresis"])
    energy_landscape_chart(figures["energy"])
    build_pdf(results, j_spin_glass, figures)
    print(OUT)


if __name__ == "__main__":
    main()
