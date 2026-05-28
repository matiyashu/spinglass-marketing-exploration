import { Lightbulb, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "info" | "warn";

interface SummaryBoxProps {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
  footer?: React.ReactNode;
}

const TONES: Record<Tone, { bg: string; border: string; text: string }> = {
  primary: { bg: "bg-primary/5", border: "border-primary/25", text: "text-primary" },
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  warn: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
};

export function SummaryBox({
  eyebrow = "What you're looking at",
  title,
  children,
  tone = "primary",
  icon: Icon = Lightbulb,
  className,
  footer,
}: SummaryBoxProps) {
  const t = TONES[tone];
  return (
    <div className={cn("rounded-xl border px-5 py-4", t.bg, t.border, className)}>
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 rounded-md bg-white/70 p-1.5", t.text)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <p className={cn("eyebrow", t.text)}>{eyebrow}</p>
          {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
          <div className="text-sm leading-relaxed text-foreground/80">{children}</div>
          {footer && <div className="pt-1 text-xs text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
