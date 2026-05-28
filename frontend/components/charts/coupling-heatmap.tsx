"use client";

import { useMemo } from "react";
import { FEATURE_LABEL } from "@/lib/features";
import type { Feature } from "@/lib/features";
import { cn } from "@/lib/utils";

interface CouplingHeatmapProps {
  features: Feature[];
  matrix: number[][];
  /** "diverging" colours by sign; "positive" maps abs() to a single ramp (Ising / MI unsigned). */
  scale?: "diverging" | "positive";
  className?: string;
}

const TEAL_RGB = [20, 184, 166];
const RED_RGB = [248, 113, 113];

function cellColor(value: number, vmax: number, scale: "diverging" | "positive"): string {
  if (vmax <= 0) return "rgb(245,245,245)";
  if (scale === "positive") {
    const t = Math.min(1, Math.abs(value) / vmax);
    const r = Math.round(255 - t * (255 - TEAL_RGB[0]));
    const g = Math.round(255 - t * (255 - TEAL_RGB[1]));
    const b = Math.round(255 - t * (255 - TEAL_RGB[2]));
    return `rgb(${r}, ${g}, ${b})`;
  }
  const t = Math.min(1, Math.abs(value) / vmax);
  const target = value >= 0 ? TEAL_RGB : RED_RGB;
  const r = Math.round(255 - t * (255 - target[0]));
  const g = Math.round(255 - t * (255 - target[1]));
  const b = Math.round(255 - t * (255 - target[2]));
  return `rgb(${r}, ${g}, ${b})`;
}

export function CouplingHeatmap({ features, matrix, scale = "diverging", className }: CouplingHeatmapProps) {
  const vmax = useMemo(() => {
    let m = 0;
    for (const row of matrix) for (const v of row) m = Math.max(m, Math.abs(v));
    return m || 1;
  }, [matrix]);
  const n = features.length;
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full text-[11px]">
        <thead>
          <tr>
            <th className="w-32" />
            {features.map((f) => (
              <th key={f} className="px-1 pb-2 align-bottom font-medium text-muted-foreground">
                <div className="origin-bottom-left -rotate-45 whitespace-nowrap text-[10px]">{FEATURE_LABEL[f]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={features[i]}>
              <td className="w-32 pr-2 text-right text-[11px] font-medium text-foreground/80">
                {FEATURE_LABEL[features[i]]}
              </td>
              {row.map((v, j) => (
                <td
                  key={j}
                  className="h-8 w-8 border border-border/40 text-center align-middle"
                  style={{ backgroundColor: cellColor(v, vmax, scale) }}
                  title={`${features[i]} × ${features[j]} = ${v.toFixed(3)}`}
                >
                  <span
                    className="text-[9px] font-medium"
                    style={{ color: Math.abs(v) / vmax > 0.5 ? "#0b1220" : "#475569" }}
                  >
                    {i === j ? "" : v.toFixed(2)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td />
            {features.map((f, j) => (
              <td key={j} className="pt-2 text-center text-[10px] text-muted-foreground">
                {j + 1}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
        {scale === "diverging" ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-6 rounded-sm" style={{ background: `rgb(${TEAL_RGB.join(",")})` }} />
              reinforcing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-6 rounded-sm" style={{ background: `rgb(${RED_RGB.join(",")})` }} />
              tension
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-6 rounded-sm" style={{ background: `rgb(${TEAL_RGB.join(",")})` }} />
            shared activation
          </span>
        )}
        <span>max |J| = {vmax.toFixed(3)}</span>
      </div>
    </div>
  );
}
