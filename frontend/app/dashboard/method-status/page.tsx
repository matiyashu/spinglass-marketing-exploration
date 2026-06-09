"use client";

import { CheckCircle2, CircleSlash } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { useWorkspace } from "@/lib/workspace";
import { useAsync } from "@/lib/use-async";
import { fetchMethodStatus } from "@/lib/marketing";

export default function MethodStatusPage() {
  const [ws] = useWorkspace();
  const { data } = useAsync(() => fetchMethodStatus(ws), [ws]);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Method status"
        description="Which analyses the currently supplied data enables — honest governance over what the workbench will and won't compute."
      />

      <SummaryBox title="What you're looking at">
        Every method declares its data requirements. A method is enabled only when all its tables are present. This is
        why outcome validation stays disabled until you supply outcomes, and why no purchase-probability forecast
        appears without a fitted outcome model.
      </SummaryBox>

      {data && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Method</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Requires</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.methods.map((m) => (
                <tr key={m.method}>
                  <td className="px-4 py-2.5 font-medium">{m.label}</td>
                  <td className="px-4 py-2.5">
                    {m.enabled ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Enabled</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground"><CircleSlash className="h-4 w-4" /> Missing {m.missing.join(", ")}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.requires.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
