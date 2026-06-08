"use client";

import { useCallback, useEffect, useState } from "react";

export type Mode = "demo-commodity" | "demo-brand" | "live";
const KEY = "spinglass.mode";
const DEFAULT_MODE: Mode = "demo-commodity";

function coerce(value: string | null): Mode {
  if (value === "demo-commodity" || value === "demo-brand" || value === "live") return value;
  // Backward compat: previous "demo" string maps to brand demo.
  if (value === "demo") return "demo-brand";
  return DEFAULT_MODE;
}

export function readMode(): Mode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  return coerce(window.localStorage.getItem(KEY));
}

export function writeMode(mode: Mode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, mode);
  window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: mode }));
}

export function isDemo(mode: Mode): boolean {
  return mode === "demo-commodity" || mode === "demo-brand";
}

/**
 * Hook returning the current mode and a setter. Reads from localStorage on mount
 * (SSR-safe: first render shows the default). Multi-tab sync via the storage event.
 */
export function useMode(): [Mode, (m: Mode) => void] {
  const [mode, setMode] = useState<Mode>(DEFAULT_MODE);

  useEffect(() => {
    setMode(readMode());
    const handler = (e: StorageEvent) => {
      if (e.key === KEY) setMode(coerce(e.newValue));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const set = useCallback((m: Mode) => {
    writeMode(m);
    setMode(m);
  }, []);

  return [mode, set];
}

export const MODE_LABELS: Record<Mode, { short: string; long: string; tone: "primary" | "info" | "muted" }> = {
  "demo-commodity": { short: "Commodity", long: "Demo · paper-aligned commodity", tone: "primary" },
  "demo-brand": { short: "Brand", long: "Demo · synthetic brand application", tone: "info" },
  live: { short: "Live", long: "Live · your data", tone: "muted" },
};
