"use client";

import { useCallback, useEffect, useState } from "react";

export type Mode = "demo" | "live";
const KEY = "spinglass.mode";

export function readMode(): Mode {
  if (typeof window === "undefined") return "demo";
  const v = window.localStorage.getItem(KEY);
  return v === "live" ? "live" : "demo";
}

export function writeMode(mode: Mode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, mode);
  window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: mode }));
}

/**
 * Hook returning the current mode and a setter. Reads from localStorage on mount
 * (so the page is SSR-safe — the first render always shows "demo" defaults).
 * Multi-tab sync via the storage event.
 */
export function useMode(): [Mode, (m: Mode) => void] {
  const [mode, setMode] = useState<Mode>("demo");

  useEffect(() => {
    setMode(readMode());
    const handler = (e: StorageEvent) => {
      if (e.key === KEY) setMode(e.newValue === "live" ? "live" : "demo");
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
