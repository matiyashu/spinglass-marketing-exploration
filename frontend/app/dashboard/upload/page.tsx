"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { DropZoneUpload } from "@/components/dropzone-upload";
import { ValidationChecklist } from "@/components/validation-checklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { validateCsv, type ValidationReport } from "@/lib/validate-csv";
import { FEATURE_LABEL } from "@/lib/features";

export default function UploadPage() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const r = await validateCsv(file);
      setReport(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "failed to parse file");
      setReport(null);
    } finally {
      setBusy(false);
    }
  }

  function handleRunStub() {
    alert(
      "Live simulation needs the optional FastAPI backend. See backend/api/ for the scaffold — for now the analysis tabs use the bundled demo scenario.",
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Get started · 2 of 2"
        title="Upload your tracker"
        description="Validation runs entirely in your browser. Nothing is uploaded to any server in demo mode."
      />

      <SummaryBox title="What the validator checks">
        Five hard errors will block import: unparseable CSV, missing required columns, fewer than 50 rows, non-numeric
        required columns, and any column with zero variance. Five warnings let you proceed but explain the caveat:
        elevated NaN rate, ignored extra columns, class imbalance, mixed scales, and small samples.
      </SummaryBox>

      <DropZoneUpload onFile={handleFile} busy={busy} fileName={report?.fileName} />

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {report && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant={report.hasErrors ? "destructive" : "success"}>
              {report.hasErrors ? "Cannot import" : "Ready to import"}
            </Badge>
            <span className="text-muted-foreground">
              {report.rowCount} rows · {report.warnings} warning{report.warnings === 1 ? "" : "s"}
            </span>
            <Button
              size="sm"
              variant={report.hasErrors ? "outline" : "default"}
              disabled={report.hasErrors}
              onClick={handleRunStub}
              className="ml-auto"
            >
              Run on my data
            </Button>
          </div>

          <ValidationChecklist checks={report.checks} />

          {report.perColumn.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Per-column summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-4 font-semibold">Column</th>
                        <th className="py-2 pr-4 font-semibold">Detected</th>
                        <th className="py-2 pr-4 font-semibold">NaN</th>
                        <th className="py-2 pr-4 font-semibold">Unique</th>
                        <th className="py-2 pr-4 font-semibold">+1 share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.perColumn.map((c) => (
                        <tr key={c.column}>
                          <td className="py-2 pr-4 align-middle">
                            <div className="font-medium">{FEATURE_LABEL[c.column]}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">{c.column}</div>
                          </td>
                          <td className="py-2 pr-4 align-middle">
                            <Badge variant={c.encoding === "binary" ? "outline" : "secondary"}>{c.encoding}</Badge>
                          </td>
                          <td className="py-2 pr-4 align-middle text-muted-foreground">{c.nans}</td>
                          <td className="py-2 pr-4 align-middle text-muted-foreground">{c.unique}</td>
                          <td className="py-2 pr-4 align-middle">
                            <div className="flex items-center gap-2">
                              <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="absolute inset-y-0 left-0 bg-primary"
                                  style={{ width: `${Math.round(c.upShare * 100)}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs">{(c.upShare * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {report.preview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview · first 5 rows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        {Object.keys(report.preview[0]).map((k) => (
                          <th key={k} className="px-2 py-1.5 font-mono font-medium">
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      {report.preview.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((v, i) => (
                            <td key={i} className="px-2 py-1.5">
                              {Number.isFinite(v) ? v : <span className="text-muted-foreground">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      <SummaryBox tone="info" eyebrow="How to read this">
        Green checks pass; amber items proceed with caveats; red items block. After a clean validation the &ldquo;Run on
        my data&rdquo; button is enabled but stubbed — wiring it up needs the optional FastAPI service in{" "}
        <code className="font-mono text-xs">backend/api/</code>.
      </SummaryBox>
    </>
  );
}
