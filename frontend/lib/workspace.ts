"use client";

import { useCallback, useEffect, useState } from "react";

// V3 replaces the V2 three-mode switch (commodity/brand/live) with a simple
// workspace toggle. Demo reads bundled JSON from /demo/v3; Live calls FastAPI.
export type Workspace = "demo" | "live";
const KEY = "spinglass.workspace";
const DEFAULT: Workspace = "demo";

function coerce(value: string | null): Workspace {
  if (value === "demo" || value === "live") return value;
  // Backward compat with the V2 mode strings.
  if (value === "demo-commodity" || value === "demo-brand") return "demo";
  return DEFAULT;
}

export function readWorkspace(): Workspace {
  if (typeof window === "undefined") return DEFAULT;
  return coerce(window.localStorage.getItem(KEY));
}

export function writeWorkspace(ws: Workspace) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, ws);
  window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: ws }));
}

export function useWorkspace(): [Workspace, (w: Workspace) => void] {
  const [ws, setWs] = useState<Workspace>(DEFAULT);
  useEffect(() => {
    setWs(readWorkspace());
    const handler = (e: StorageEvent) => {
      if (e.key === KEY) setWs(coerce(e.newValue));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  const set = useCallback((w: Workspace) => {
    writeWorkspace(w);
    setWs(w);
  }, []);
  return [ws, set];
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:8000";

export const SHOW_BENCHMARK = process.env.NEXT_PUBLIC_SHOW_METHOD_BENCHMARK === "true";
