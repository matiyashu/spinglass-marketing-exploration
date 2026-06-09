"use client";

import { useMarketingContext } from "@/lib/context";
import type { Dimensions, MarketingContext } from "@/lib/marketing";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  value: string | null;
  options: { id: string; label: string }[];
  allLabel?: string;
  onChange: (v: string | null) => void;
  disabled?: boolean;
}

function Field({ label, value, options, allLabel, onChange, disabled }: FieldProps) {
  return (
    <label className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(
          "h-7 max-w-[10rem] truncate rounded-md border bg-card px-2 text-xs font-medium text-foreground",
          "focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50",
        )}
      >
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ContextSelector() {
  const { dimensions, context, setContext, ready } = useMarketingContext();
  if (!ready || !dimensions) {
    return <div className="h-7 w-full animate-pulse rounded-md bg-muted/50" />;
  }

  const products = dimensions.products.filter((p) => p.brand_id === context.brand_id);
  const campaigns = dimensions.campaigns.filter((c) => c.brand_id === context.brand_id);

  const patch = (k: keyof MarketingContext) => (v: string | null) => setContext({ [k]: v });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="Brand" value={context.brand_id} options={dimensions.brands} onChange={(v) => v && setContext({ brand_id: v })} />
      <Field label="Product" value={context.product_id} options={products} allLabel="All products" onChange={patch("product_id")} />
      <Field label="Market" value={context.market} options={dimensions.markets} allLabel="All markets" onChange={patch("market")} />
      <Field label="Segment" value={context.segment} options={dimensions.segments} allLabel="All segments" onChange={patch("segment")} />
      <Field label="Campaign" value={context.campaign_id} options={campaigns} allLabel="No campaign" onChange={patch("campaign_id")} />
    </div>
  );
}

/** Helper: turn the active context into a readable breadcrumb trail. */
export function contextTrail(dimensions: Dimensions | null, context: MarketingContext): string[] {
  if (!dimensions) return [];
  const lookup = (kind: keyof Dimensions, id: string | null) => {
    if (!id) return null;
    const list = dimensions[kind];
    if (!Array.isArray(list)) return id;
    return list.find((x) => x.id === id)?.label ?? id;
  };
  return [
    lookup("brands", context.brand_id),
    lookup("products", context.product_id),
    lookup("markets", context.market),
    lookup("segments", context.segment),
    lookup("campaigns", context.campaign_id),
  ].filter(Boolean) as string[];
}
