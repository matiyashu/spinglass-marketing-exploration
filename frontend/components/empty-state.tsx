"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { writeMode } from "@/lib/mode";

interface EmptyStateProps {
  title?: string;
  body?: string;
}

export function EmptyState({
  title = "No data yet — you're in live mode",
  body = "This chart awaits your data. Upload a CSV and start the optional FastAPI service to populate it, or switch back to demo mode to see the bundled example.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>
      <div className="mt-2 flex gap-2">
        <Button asChild size="sm">
          <Link href="/dashboard/upload">Go to upload</Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => writeMode("demo")}>
          Switch to demo mode
        </Button>
      </div>
    </div>
  );
}
