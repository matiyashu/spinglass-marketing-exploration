export const COMMODITY_ASSETS = [
  "gold",
  "silver",
  "platinum",
  "palladium",
  "copper",
  "wti_crude",
  "brent_crude",
  "natural_gas",
  "heating_oil",
  "wheat",
  "corn",
  "soybeans",
  "coffee",
  "sugar",
  "cotton",
] as const;

export type CommodityAsset = (typeof COMMODITY_ASSETS)[number];

export const COMMODITY_GROUPS: Record<CommodityAsset, string> = {
  gold: "precious_metals",
  silver: "precious_metals",
  platinum: "precious_metals",
  palladium: "precious_metals",
  copper: "industrial_metals",
  wti_crude: "energy",
  brent_crude: "energy",
  natural_gas: "energy",
  heating_oil: "energy",
  wheat: "grains",
  corn: "grains",
  soybeans: "grains",
  coffee: "softs",
  sugar: "softs",
  cotton: "softs",
};

export const COMMODITY_LABEL: Record<CommodityAsset, string> = {
  gold: "Gold",
  silver: "Silver",
  platinum: "Platinum",
  palladium: "Palladium",
  copper: "Copper",
  wti_crude: "WTI crude",
  brent_crude: "Brent crude",
  natural_gas: "Natural gas",
  heating_oil: "Heating oil",
  wheat: "Wheat",
  corn: "Corn",
  soybeans: "Soybeans",
  coffee: "Coffee",
  sugar: "Sugar",
  cotton: "Cotton",
};

export type CommoditySnapshot = "latest" | "covid_stress" | "energy_stress";

export interface CommodityCouplingPayload {
  assets: CommodityAsset[];
  window_size: number;
  spinglass: number[][];
  ising: number[][];
  mi: number[][];
}

export interface RollingMetric {
  window_start: string;
  window_end: string;
  window_size: number;
  step: number;
  avg_signed_coupling: number;
  avg_abs_coupling_ising: number;
  avg_mutual_information: number;
  largest_eigenvalue_signed: number;
  largest_eigenvalue_ising: number;
  negative_edge_share: number;
}

async function load<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) throw new Error(`failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export const commodityLoader = {
  couplings: (snapshot: CommoditySnapshot) =>
    load<CommodityCouplingPayload>(`/demo/v2/commodity/couplings_${snapshot}.json`),
  rolling: () => load<{ records: RollingMetric[] }>(`/demo/v2/commodity/rolling_metrics.json`),
};

export const SNAPSHOT_LABELS: Record<CommoditySnapshot, { short: string; window: string; story: string }> = {
  latest: {
    short: "Latest window",
    window: "Late 2024",
    story: "Closest 90-day window to the end of the panel. Useful as a baseline for the calm regime.",
  },
  covid_stress: {
    short: "COVID stress",
    window: "Feb–May 2020",
    story:
      "Window centred on the March 2020 shock. Cross-asset synchronisation typically jumps, the largest eigenvalue lifts, and the signed-coupling sign mix collapses toward all-positive.",
  },
  energy_stress: {
    short: "Energy crisis",
    window: "Jan–May 2022",
    story:
      "Window centred on the early-2022 energy crisis. Energy assets co-move strongly with industrials and grains; precious metals partially decouple.",
  },
};
