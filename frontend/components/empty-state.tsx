"use client";

import Link from "next/link";
import { Inbox, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { writeMode, type Mode } from "@/lib/mode";

interface EmptyStateProps {
  /** Which demo this page belongs to. Controls the copy when the user is in a different mode. */
  expects?: "brand" | "commodity";
  /** Current mode. If passed, the component picks copy tailored to the mismatch. */
  mode?: Mode;
  title?: string;
  body?: string;
}

export function EmptyState({ expects = "brand", mode, title, body }: EmptyStateProps) {
  const wrongDemo = mode === (expects === "brand" ? "demo-commodity" : "demo-brand");

  let derivedTitle = title;
  let derivedBody = body;
  let primary: { label: string; href?: string; onClick?: () => void };
  let secondary: { label: string; href?: string; onClick?: () => void };

  if (wrongDemo) {
    const target = expects === "brand" ? "demo-brand" : "demo-commodity";
    const otherHref = expects === "brand" ? "/dashboard" : "/dashboard/commodity";
    derivedTitle ??= `Switch to the ${expects} demo to see this chart`;
    derivedBody ??=
      expects === "brand"
        ? "This panel renders against the synthetic brand-tracker data. You're currently in the commodity demo."
        : "This panel renders against the synthetic commodity-like price series. You're currently in the brand demo.";
    primary = { label: `Switch to ${expects} demo`, onClick: () => writeMode(target) };
    secondary = { label: `Stay in ${expects === "brand" ? "commodity" : "brand"} demo`, href: otherHref };
  } else {
    // Live mode
    derivedTitle ??= "No data yet — you're in live mode";
    derivedBody ??=
      "This chart awaits your data. Upload a CSV and start the optional FastAPI service to populate it, or switch to a demo mode to see a worked example.";
    primary = { label: "Go to upload", href: "/dashboard/upload" };
    secondary = {
      label: `Switch to ${expects} demo`,
      onClick: () => writeMode(expects === "brand" ? "demo-brand" : "demo-commodity"),
    };
  }

  const Icon = wrongDemo ? LineChart : Inbox;

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{derivedTitle}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{derivedBody}</p>
      <div className="mt-2 flex gap-2">
        {primary.href ? (
          <Button asChild size="sm">
            <Link href={primary.href}>{primary.label}</Link>
          </Button>
        ) : (
          <Button size="sm" onClick={primary.onClick}>{primary.label}</Button>
        )}
        {secondary.href ? (
          <Button asChild size="sm" variant="outline">
            <Link href={secondary.href}>{secondary.label}</Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={secondary.onClick}>{secondary.label}</Button>
        )}
      </div>
    </div>
  );
}
