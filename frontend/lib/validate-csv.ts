import Papa from "papaparse";
import { FEATURES, type Feature } from "./features";
import { binarizeColumn, isBinary, spinShare } from "./binarize";

export type CheckLevel = "ok" | "warning" | "error";

export interface CheckResult {
  id: string;
  level: CheckLevel;
  label: string;
  detail?: string;
}

export interface ColumnSummary {
  column: Feature;
  rows: number;
  nans: number;
  unique: number;
  upShare: number;
  encoding: "binary" | "ordinal";
}

export interface ValidationReport {
  fileName: string;
  rowCount: number;
  parseErrors: number;
  extraColumns: string[];
  checks: CheckResult[];
  hasErrors: boolean;
  warnings: number;
  perColumn: ColumnSummary[];
  preview: Record<Feature, number>[];
}

const REQUIRED = new Set<string>(FEATURES);

function coerceNumeric(value: unknown): number {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "number") return value;
  const s = String(value).trim();
  if (s === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export async function validateCsv(file: File): Promise<ValidationReport> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (result) => {
        try {
          resolve(buildReport(file.name, result));
        } catch (e) {
          reject(e);
        }
      },
      error: reject,
    });
  });
}

function buildReport(
  fileName: string,
  result: Papa.ParseResult<Record<string, unknown>>,
): ValidationReport {
  const checks: CheckResult[] = [];
  const headers = result.meta.fields ?? [];
  const missing = FEATURES.filter((f) => !headers.includes(f));
  const extraColumns = headers.filter((h) => !REQUIRED.has(h));
  const rows = result.data;
  const parseErrors = result.errors?.length ?? 0;

  // 1) Parse cleanliness
  checks.push(
    parseErrors === 0
      ? { id: "parse", level: "ok", label: "CSV parses cleanly" }
      : { id: "parse", level: "warning", label: `Parser reported ${parseErrors} row issue(s)` },
  );

  // 2) Required columns
  if (missing.length === 0) {
    checks.push({ id: "columns", level: "ok", label: "All 10 required columns present" });
  } else {
    checks.push({
      id: "columns",
      level: "error",
      label: `Missing required column(s): ${missing.join(", ")}`,
      detail: "Add these columns or rename existing ones to match.",
    });
  }

  // 3) Row count
  if (rows.length >= 200) {
    checks.push({ id: "rows", level: "ok", label: `${rows.length} rows (≥ 200 recommended)` });
  } else if (rows.length >= 50) {
    checks.push({
      id: "rows",
      level: "warning",
      label: `${rows.length} rows — usable but statistically thin`,
      detail: "Couplings stabilise around 200+ rows.",
    });
  } else {
    checks.push({
      id: "rows",
      level: "error",
      label: `${rows.length} rows — need at least 50`,
    });
  }

  // 4) Extra columns
  if (extraColumns.length > 0) {
    checks.push({
      id: "extras",
      level: "warning",
      label: `Ignoring ${extraColumns.length} extra column(s)`,
      detail: extraColumns.join(", "),
    });
  }

  // Per-column analysis (only if no missing required columns)
  const perColumn: ColumnSummary[] = [];
  const preview: Record<Feature, number>[] = [];

  if (missing.length === 0) {
    let allNumeric = true;
    let zeroVarFeature: Feature | null = null;
    let highNanFeature: Feature | null = null;
    let imbalancedFeatures: Feature[] = [];
    let binaryCols = 0;
    let ordinalCols = 0;

    for (const feature of FEATURES) {
      const raw = rows.map((r) => coerceNumeric(r[feature]));
      const numericCount = raw.filter((v) => Number.isFinite(v)).length;
      const nans = raw.length - numericCount;
      const uniqueSet = new Set(raw.filter((v) => Number.isFinite(v)));

      if (numericCount === 0) allNumeric = false;
      if (uniqueSet.size <= 1 && numericCount > 0) zeroVarFeature = feature;
      if (nans / Math.max(1, raw.length) > 0.05) highNanFeature = feature;

      const binary = isBinary(raw.filter((v) => Number.isFinite(v)) as number[]);
      if (binary) binaryCols += 1;
      else ordinalCols += 1;

      const spins = binarizeColumn(raw);
      const share = spinShare(spins);
      if (share.up < 0.1 || share.up > 0.9) imbalancedFeatures.push(feature);

      perColumn.push({
        column: feature,
        rows: raw.length,
        nans,
        unique: uniqueSet.size,
        upShare: share.up,
        encoding: binary ? "binary" : "ordinal",
      });
    }

    checks.push(
      allNumeric
        ? { id: "numeric", level: "ok", label: "All required columns are numeric" }
        : {
            id: "numeric",
            level: "error",
            label: "One or more required columns are entirely non-numeric",
          },
    );

    checks.push(
      zeroVarFeature === null
        ? { id: "variance", level: "ok", label: "Every column has at least 2 distinct values" }
        : {
            id: "variance",
            level: "error",
            label: `Column has zero variance: ${zeroVarFeature}`,
            detail: "Spin-glass couplings need variance — drop or fix this column.",
          },
    );

    if (highNanFeature) {
      checks.push({
        id: "nans",
        level: "warning",
        label: `> 5 % missing values in column: ${highNanFeature}`,
        detail: "Consider imputing or dropping rows with missing values.",
      });
    } else {
      checks.push({ id: "nans", level: "ok", label: "Missing-value rate below 5 % across columns" });
    }

    if (imbalancedFeatures.length > 0) {
      checks.push({
        id: "imbalance",
        level: "warning",
        label: `Class imbalance > 90/10 in: ${imbalancedFeatures.join(", ")}`,
        detail: "Highly skewed columns weaken correlation estimates.",
      });
    } else {
      checks.push({ id: "imbalance", level: "ok", label: "Class balance within 10 / 90 across columns" });
    }

    if (binaryCols > 0 && ordinalCols > 0) {
      checks.push({
        id: "scale",
        level: "warning",
        label: `Mixed scales: ${binaryCols} binary, ${ordinalCols} ordinal column(s)`,
        detail: "Binarisation will median-split ordinal columns. Confirm this is intended.",
      });
    }

    // Preview = first 5 valid rows
    for (const r of rows.slice(0, 5)) {
      const obj: Partial<Record<Feature, number>> = {};
      for (const f of FEATURES) obj[f] = coerceNumeric(r[f]);
      preview.push(obj as Record<Feature, number>);
    }
  }

  const hasErrors = checks.some((c) => c.level === "error");
  const warnings = checks.filter((c) => c.level === "warning").length;

  return {
    fileName,
    rowCount: rows.length,
    parseErrors,
    extraColumns,
    checks,
    hasErrors,
    warnings,
    perColumn,
    preview,
  };
}
