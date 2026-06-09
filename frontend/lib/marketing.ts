import type { Feature, FeatureGroup } from "./features";
import { API_BASE, type Workspace } from "./workspace";

const DEMO = "/demo/v3";

async function loadJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) throw new Error(`failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

async function postApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

// --- Dimension + context types --------------------------------------------

export interface DimItem {
  id: string;
  label: string;
  brand_id?: string;
  vertical_id?: string;
  product_id?: string;
  creative_id?: string;
  price_tier?: string;
  start_date?: string;
  end_date?: string;
  has_outcomes?: boolean;
  group?: FeatureGroup;
}

export interface Dimensions {
  brands: DimItem[];
  verticals: DimItem[];
  products: DimItem[];
  markets: DimItem[];
  segments: DimItem[];
  campaigns: DimItem[];
  features: DimItem[];
  n_waves: number;
}

export interface MarketingContext {
  brand_id: string;
  product_id: string | null;
  vertical_id: string | null;
  market: string | null;
  segment: string | null;
  campaign_id: string | null;
}

// --- Payload types ---------------------------------------------------------

export interface Edge {
  a: Feature;
  b: Feature;
  j: number;
}

export interface Triad {
  features: Feature[];
  couplings: number[];
  min_abs: number;
}

export interface CouplingSummary {
  avg_signed_coupling: number;
  avg_abs_coupling_ising: number;
  largest_eigenvalue_signed: number;
  largest_eigenvalue_ising: number;
  negative_edge_share: number;
  avg_mutual_information: number;
  n_respondents: number;
}

export interface CouplingPayload {
  features: Feature[];
  labels: string[];
  groups: FeatureGroup[];
  spin_glass: number[][];
  ising: number[][];
  mi: number[][];
  top: { reinforcing: Edge[]; conflicting: Edge[] };
  triads: Triad[];
  rigidity_proxy: number;
  summary: CouplingSummary;
}

export interface RollingRecord {
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

export interface BrandSummary extends CouplingSummary {
  brand_id: string;
  rigidity_proxy: number;
}

export interface SegmentPayload {
  brand_id: string;
  overlap: { segments: string[]; matrix: number[][] };
  per_segment: (CouplingSummary & { segment: string; rigidity_proxy: number })[];
}

export interface VerticalsPayload {
  brand_id: string;
  per_product: (CouplingSummary & {
    product_id: string;
    label: string;
    vertical_id: string;
    price_tier: string | null;
    rigidity_proxy: number;
    competitor_overlap: number;
  })[];
}

export interface LeakagePayload {
  brand_id: string;
  series: { date: string; competitor_overlap: number; leak_share: number; n: number }[];
}

export interface PQ {
  q: number[];
  pq: number[];
  mean: number;
  std: number;
}

export interface ReplicaPayload {
  brand_id: string;
  landscape: PQ;
  estimation: PQ;
  rigidity_proxy: number;
}

export interface SimRow {
  spend: number;
  target_overlap: number;
  competitor_overlap: number;
  frustration: number;
  rigidity_proxy: number;
}

export interface CampaignPayload {
  campaign: DimItem;
  creative_map: { feature_name: Feature; target_spin: number; intended_strength: number; evidence_source: string }[];
  target_vector: number[];
  features: Feature[];
  phase_overlap: { pre: number | null; during: number | null; post: number | null };
  phase_means: { pre: number[] | null; during: number[] | null; post: number[] | null };
  simulation: SimRow[];
  has_outcomes: boolean;
  outcomes?: { date: string; brand_lift: number; roas: number; cpa: number; conversions: number }[];
}

export interface MethodStatusItem {
  method: string;
  label: string;
  requires: string[];
  enabled: boolean;
  missing: string[];
}

export interface MethodStatusPayload {
  tables_present: string[];
  methods: MethodStatusItem[];
}

// --- Demo loaders ----------------------------------------------------------

/** Resolve the most specific precomputed coupling slice for a context. */
function couplingKey(ctx: Pick<MarketingContext, "brand_id" | "segment">): string {
  return ctx.segment ? `${ctx.brand_id}__${ctx.segment}` : ctx.brand_id;
}

export const marketingLoader = {
  dimensions: () => loadJson<Dimensions>(`${DEMO}/dimensions.json`),
  methodStatus: () => loadJson<MethodStatusPayload>(`${DEMO}/method_status.json`),
  portfolio: () => loadJson<{ brands: BrandSummary[] }>(`${DEMO}/portfolio.json`),
  couplings: (ctx: Pick<MarketingContext, "brand_id" | "segment">) =>
    loadJson<CouplingPayload>(`${DEMO}/couplings/${couplingKey(ctx)}.json`).catch(() =>
      loadJson<CouplingPayload>(`${DEMO}/couplings/${ctx.brand_id}.json`),
    ),
  rolling: (brand: string) => loadJson<{ brand_id: string; records: RollingRecord[] }>(`${DEMO}/rolling/${brand}.json`),
  segments: (brand: string) => loadJson<SegmentPayload>(`${DEMO}/segments/${brand}.json`),
  verticals: (brand: string) => loadJson<VerticalsPayload>(`${DEMO}/verticals/${brand}.json`),
  leakage: (brand: string) => loadJson<LeakagePayload>(`${DEMO}/leakage/${brand}.json`),
  replicas: (brand: string) => loadJson<ReplicaPayload>(`${DEMO}/replicas/${brand}.json`),
  stability: (brand: string) => loadJson<{ brand_id: string; susceptibility: { feature: Feature; chi: number }[] }>(`${DEMO}/stability/${brand}.json`),
  campaign: (id: string) => loadJson<CampaignPayload>(`${DEMO}/campaigns/${id}.json`),
};

// --- Live (FastAPI) helpers ------------------------------------------------
// In Live workspace, compute against the backend's bundled sample using the
// same context filter. Returns the same payload shapes as the demo loaders.

export const marketingLive = {
  couplings: (ctx: MarketingContext) =>
    postApi<CouplingPayload>("/marketing/couplings/static", { context: ctx, use_sample: true }),
  rolling: (ctx: MarketingContext) =>
    postApi<{ brand_id: string; records: RollingRecord[] }>("/marketing/couplings/rolling", {
      context: ctx,
      use_sample: true,
    }),
  methodStatus: () => postApi<MethodStatusPayload>("/data/status", { use_sample: true }),
};

// --- Workspace-aware resolvers (used by pages) -----------------------------
// Demo reads the bundle; Live computes against the backend's bundled sample.
// Resources that only differ by brand fall back to the demo bundle in Live.

export function fetchCouplings(ws: Workspace, ctx: MarketingContext): Promise<CouplingPayload> {
  return ws === "live" ? marketingLive.couplings(ctx) : marketingLoader.couplings(ctx);
}

export function fetchRolling(ws: Workspace, ctx: MarketingContext): Promise<{ brand_id: string; records: RollingRecord[] }> {
  return ws === "live" ? marketingLive.rolling(ctx) : marketingLoader.rolling(ctx.brand_id);
}

export function fetchMethodStatus(ws: Workspace): Promise<MethodStatusPayload> {
  return ws === "live" ? marketingLive.methodStatus() : marketingLoader.methodStatus();
}
