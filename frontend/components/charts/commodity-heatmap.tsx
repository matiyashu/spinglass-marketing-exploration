"use client";

import { useMemo } from "react";
import { COMMODITY_GROUPS, COMMODITY_LABEL, type CommodityAsset } from "@/lib/commodity";
import { cn } from "@/lib/utils";

interface CommodityHeatmapProps {
  assets: CommodityAsset[];
  matrix: number[][];
  scale?: "diverging" | "positive";
  className?: string;
}

const TEAL_RGB = [20, 184, 166];
const RED_RGB = [248, 113, 113];

const GROUP_TINT: Record<string, string> = {
  precious_metals: "bg-amber-50 text-amber-800",
  industrial_metals: "bg-orange-50 text-orange-800",
  energy: "bg-red-50 text-red-800",
  grains: "bg-emerald-50 text-emerald-800",
  softs: "bg-fuchsia-50 text-fuchsia-800",
};

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

export function CommodityHeatmap({ assets, matrix, scale = "diverging", className }: CommodityHeatmapProps) {
  const vmax = useMemo(() => {
    let m = 0;
    for (const row of matrix) for (const v of row) m = Math.max(m, Math.abs(v));
    return m || 1;
  }, [matrix]);
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full text-[10px]">
        <thead>
          <tr>
            <th className="w-28" />
            {assets.map((a) => (
              <th key={a} className="px-1 pb-2 align-bottom font-medium text-muted-foreground">
                <div className="origin-bottom-left -rotate-45 whitespace-nowrap text-[10px]">
                  {COMMODITY_LABEL[a]}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={assets[i]}>
              <td className="w-28 pr-2 text-right">
                <span
                  className={cn(
                    "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                    GROUP_TINT[COMMODITY_GROUPS[assets[i]]] ?? "bg-muted text-foreground/70",
                  )}
                  title={COMMODITY_GROUPS[assets[i]]}
                >
                  {COMMODITY_LABEL[assets[i]]}
                </span>
              </td>
              {row.map((v, j) => (
                <td
                  key={j}
                  className="h-7 w-7 border border-border/40 text-center align-middle"
                  style={{ backgroundColor: cellColor(v, vmax, scale) }}
                  title={`${assets[i]} × ${assets[j]} = ${v.toFixed(3)}`}
                >
                  <span
                    className="text-[8.5px] font-medium"
                    style={{ color: Math.abs(v) / vmax > 0.5 ? "#0b1220" : "#475569" }}
                  >
                    {i === j ? "" : v.toFixed(2)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        {scale === "diverging" ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-6 rounded-sm" style={{ background: `rgb(${TEAL_RGB.join(",")})` }} />
              co-moving
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-6 rounded-sm" style={{ background: `rgb(${RED_RGB.join(",")})` }} />
              counter-moving
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-6 rounded-sm" style={{ background: `rgb(${TEAL_RGB.join(",")})` }} />
            synchronisation strength
          </span>
        )}
        <span>max |J| = {vmax.toFixed(3)}</span>
      </div>
    </div>
  );
}
