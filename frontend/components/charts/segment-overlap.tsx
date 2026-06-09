"use client";

import { cn } from "@/lib/utils";

interface Props {
  segments: string[];
  matrix: number[][];
  className?: string;
}

function label(seg: string) {
  return seg.replace(/_/g, " ");
}

function color(v: number) {
  const t = Math.max(0, Math.min(1, (v + 1) / 2)); // -1..1 → 0..1
  const r = Math.round(255 - t * (255 - 20));
  const g = Math.round(255 - t * (255 - 184));
  const b = Math.round(255 - t * (255 - 166));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Cross-segment memory overlap: how similarly two audiences encode the brand. */
export function SegmentOverlap({ segments, matrix, className }: Props) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="text-[11px]">
        <thead>
          <tr>
            <th className="w-32" />
            {segments.map((s) => (
              <th key={s} className="px-1 pb-2 align-bottom font-medium text-muted-foreground">
                <div className="origin-bottom-left -rotate-45 whitespace-nowrap capitalize">{label(s)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={segments[i]}>
              <td className="w-32 pr-2 text-right font-medium capitalize">{label(segments[i])}</td>
              {row.map((v, j) => (
                <td
                  key={j}
                  className="h-9 w-14 border border-border/40 text-center align-middle"
                  style={{ backgroundColor: color(v) }}
                  title={`${label(segments[i])} × ${label(segments[j])} = ${v.toFixed(3)}`}
                >
                  <span className="text-[10px] font-medium" style={{ color: v > 0.5 ? "#0b1220" : "#475569" }}>
                    {v.toFixed(2)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-muted-foreground">
        1.0 = identical brand memory; lower values = audiences holding different meanings (segment fragmentation).
      </p>
    </div>
  );
}
