/**
 * TS port of brand_ising_spin_glass.binarize_to_spins — used only to compute
 * class-balance warnings during validation. No inference happens client-side.
 */
export type Spin = -1 | 1;

export function isBinary(values: number[]): boolean {
  const uniq = new Set<number>();
  for (const v of values) {
    if (Number.isFinite(v)) uniq.add(v);
    if (uniq.size > 2) return false;
  }
  if (uniq.size > 2) return false;
  const arr = [...uniq];
  return arr.every((v) => v === 0 || v === 1);
}

export function median(values: number[]): number {
  const cleaned = values.filter((v) => Number.isFinite(v)).slice().sort((a, b) => a - b);
  if (cleaned.length === 0) return 0;
  const mid = Math.floor(cleaned.length / 2);
  return cleaned.length % 2 === 0 ? (cleaned[mid - 1] + cleaned[mid]) / 2 : cleaned[mid];
}

/**
 * Map numeric values to +/-1 spins. Binary {0,1} columns → values above 0 are +1.
 * Continuous/ordinal columns → values above the column median are +1.
 */
export function binarizeColumn(values: number[]): Spin[] {
  const cutoff = isBinary(values) ? 0 : median(values);
  return values.map<Spin>((v) => (Number.isFinite(v) && v > cutoff ? 1 : -1));
}

export function spinShare(spins: Spin[]): { up: number; down: number } {
  if (spins.length === 0) return { up: 0, down: 0 };
  const up = spins.filter((s) => s === 1).length / spins.length;
  return { up, down: 1 - up };
}
