"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export interface FaqItem {
  q: string;
  a: React.ReactNode;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion type="multiple" className="rounded-xl border bg-card px-5">
      {items.map((item, idx) => (
        <AccordionItem key={idx} value={`item-${idx}`}>
          <AccordionTrigger className="text-left text-sm font-medium text-foreground">{item.q}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
