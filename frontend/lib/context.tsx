"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { marketingLoader, type Dimensions, type MarketingContext } from "./marketing";

const KEY = "spinglass.context";

interface ContextValue {
  dimensions: Dimensions | null;
  context: MarketingContext;
  setContext: (patch: Partial<MarketingContext>) => void;
  ready: boolean;
}

const Ctx = createContext<ContextValue | null>(null);

const FALLBACK: MarketingContext = {
  brand_id: "brand_a",
  product_id: null,
  vertical_id: null,
  market: null,
  segment: null,
  campaign_id: null,
};

function read(): MarketingContext {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...FALLBACK, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return FALLBACK;
}

export function MarketingContextProvider({ children }: { children: React.ReactNode }) {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [context, setCtx] = useState<MarketingContext>(FALLBACK);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = read();
    setCtx(stored);
    marketingLoader
      .dimensions()
      .then((d) => {
        setDimensions(d);
        // Ensure the stored brand still exists; otherwise reset to the first.
        if (!d.brands.some((b) => b.id === stored.brand_id)) {
          setCtx({ ...stored, brand_id: d.brands[0].id });
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setContext = useCallback((patch: Partial<MarketingContext>) => {
    setCtx((prev) => {
      const next = { ...prev, ...patch };
      // Changing brand clears the narrower selections that may not apply.
      if (patch.brand_id && patch.brand_id !== prev.brand_id) {
        next.product_id = null;
        next.campaign_id = null;
      }
      if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ dimensions, context, setContext, ready }), [dimensions, context, setContext, ready]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMarketingContext(): ContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMarketingContext must be used inside MarketingContextProvider");
  return v;
}

/** Convenience: the human label for a dimension id. */
export function useDimLabel() {
  const { dimensions } = useMarketingContext();
  return useCallback(
    (kind: keyof Dimensions, id: string | null): string => {
      if (!id || !dimensions) return "—";
      const list = dimensions[kind];
      if (!Array.isArray(list)) return id;
      return list.find((x) => x.id === id)?.label ?? id;
    },
    [dimensions],
  );
}
