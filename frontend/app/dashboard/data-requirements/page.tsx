import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SummaryBox } from "@/components/summary-box";
import { FeatureGlossary } from "@/components/feature-glossary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DataRequirementsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get started · 1 of 2"
        title="Data requirements"
        description="One binary survey row per respondent. The kernel needs ten columns; nothing else is required."
        actions={
          <Button asChild>
            <a href="/demo/sample.csv" download>
              <Download className="h-4 w-4" /> CSV template
            </a>
          </Button>
        }
      />

      <SummaryBox title="The 10 required columns">
        Every column is binarised into a spin {`{−1, +1}`} before any computation. Pure 0/1 columns pass through unchanged
        (anything &gt; 0 is +1). Continuous or Likert columns are median-split. Mix scales freely — the validator will
        flag anything that needs your attention.
      </SummaryBox>

      <FeatureGlossary />

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sample size</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">50 rows</span> is the absolute minimum the validator accepts.</p>
            <p><span className="font-medium text-foreground">200+ rows</span> is the level at which signed correlations stabilise and the recovered couplings start to look like the true ones.</p>
            <p>Surveys with &lt; 50 rows are rejected outright; surveys with 50–199 rows are flagged with a statistical caveat.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Missing values & variance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Up to <span className="font-medium text-foreground">5 % NaN per column</span> is tolerated; above that the validator warns.</p>
            <p>Each required column must have at least two distinct values. A column that is all-1 or all-0 has zero variance — the spin-glass couplings derived from it would be undefined, so it&rsquo;s a hard error.</p>
            <p>Class balance should fall between 10 / 90 and 90 / 10 after binarisation. Heavier skew weakens the signal.</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Optional extras</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>You can include extra columns such as <code className="font-mono text-xs">segment_id</code>, <code className="font-mono text-xs">weight</code>, <code className="font-mono text-xs">wave</code>, or any free-text comments. They are ignored by the kernel and preserved in the preview.</p>
          <p>Brand identifiers are <span className="font-medium text-foreground">not required</span> — this is a respondent-level model. If you want to compare brands, run the analysis once per brand subset.</p>
          <p>
            See the <Link href="/dashboard/faq" className="text-primary hover:underline">FAQ</Link> for the full
            methodology rationale, or jump straight to <Link href="/dashboard/upload" className="text-primary hover:underline">Upload data</Link>.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
