import { BookOpen } from "lucide-react";
import { FaqAccordion, type FaqItem } from "@/components/faq-accordion";

interface ChartFaqProps {
  title?: string;
  intro?: string;
  items: FaqItem[];
}

/**
 * Per-chart FAQ. Explains how to read the chart and how to interpret the
 * specific values shown. Use one per analysis page, right under the chart.
 */
export function ChartFaq({ title = "How to read this chart", intro, items }: ChartFaqProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>
      {intro && <p className="text-sm text-muted-foreground">{intro}</p>}
      <FaqAccordion items={items} />
    </section>
  );
}
