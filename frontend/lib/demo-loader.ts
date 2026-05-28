import { FEATURES, type Feature } from "./features";

export type CouplingMode = "spinglass" | "ising" | "mi";

export interface CouplingPayload {
  features: Feature[];
  matrix: number[][];
  mode: string;
}

export interface ScenarioRow {
  name: string;
  spend: number;
  target_overlap: number;
  competitor_overlap: number;
  mean_consideration: number;
  purchase_probability: number;
  frustration: number;
}

export interface MemoryPayload {
  features: Feature[];
  target_pattern: number[];
  competitor_pattern: number[];
  scenarios: { name: string; target_overlap: number; competitor_overlap: number }[];
}

export interface PulsePoint {
  t: number;
  campaign: number;
  shortterm: number;
  longterm: number;
}

export interface HysteresisPoint {
  h: number;
  increasing: number;
  decreasing: number;
}

export interface LandscapePoint {
  m: number;
  baseline: number;
  campaign: number;
  memory: number;
}

async function load<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) throw new Error(`failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export const demoLoader = {
  couplings: (mode: CouplingMode) => load<CouplingPayload>(`/demo/couplings_${mode}.json`),
  scenarios: () => load<{ scenarios: ScenarioRow[] }>("/demo/scenarios.json"),
  memory: () => load<MemoryPayload>("/demo/memory.json"),
  pulse: () => load<{ points: PulsePoint[] }>("/demo/pulse.json"),
  hysteresis: () => load<{ points: HysteresisPoint[] }>("/demo/hysteresis.json"),
  landscape: () => load<{ points: LandscapePoint[] }>("/demo/landscape.json"),
};

export { FEATURES };
