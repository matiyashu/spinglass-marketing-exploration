"use client";

import { useEffect, useState } from "react";
import { ScienceBadge, type ScienceStatus } from "@/components/science-badge";
import { DataSufficiencyBadge } from "@/components/data-sufficiency-badge";
import { marketingLoader, type MethodStatusItem } from "@/lib/marketing";

interface Props {
  science: ScienceStatus;
  /** Method ids this page depends on; their enabled/missing state is shown. */
  methods?: string[];
  note?: string;
}

/** Strip rendered under a PageHeader: scientific status + data-sufficiency. */
export function MethodStatusBar({ science, methods = [], note }: Props) {
  const [status, setStatus] = useState<MethodStatusItem[]>([]);

  useEffect(() => {
    marketingLoader
      .methodStatus()
      .then((s) => setStatus(s.methods))
      .catch(() => setStatus([]));
  }, []);

  const relevant = methods
    .map((m) => status.find((s) => s.method === m))
    .filter((x): x is MethodStatusItem => Boolean(x));

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card/60 px-3 py-2">
      <ScienceBadge status={science} inline />
      {relevant.map((m) => (
        <DataSufficiencyBadge key={m.method} enabled={m.enabled} label={m.label} missing={m.missing} />
      ))}
      {note && <span className="ml-auto text-[11px] text-muted-foreground">{note}</span>}
    </div>
  );
}
