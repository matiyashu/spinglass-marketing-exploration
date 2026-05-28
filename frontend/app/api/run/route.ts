import { NextResponse } from "next/server";

/**
 * Stub for the future "run on my data" endpoint. When the optional FastAPI
 * sidecar (backend/api/) is wired up, this route proxies to it. Until then it
 * echoes the payload and returns 501 so callers can detect the bridge is off.
 */
export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }
  return NextResponse.json(
    {
      ok: false,
      reason: "live_compute_not_wired",
      hint: "Start the FastAPI service in backend/api/ and set NEXT_PUBLIC_API_URL to enable.",
      echo: payload,
    },
    { status: 501 },
  );
}
