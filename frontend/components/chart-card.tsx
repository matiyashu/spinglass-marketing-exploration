import { ScienceBadge, type ScienceStatus } from "@/components/science-badge";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  science?: ScienceStatus;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, footer, actions, science, children, className }: ChartCardProps) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-sm", className)}>
      <header className="flex items-start justify-between gap-4 border-b p-5">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            {science && <ScienceBadge status={science} inline />}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
      {footer && (
        <footer className="border-t bg-muted/40 px-5 py-3 text-xs text-muted-foreground">{footer}</footer>
      )}
    </section>
  );
}
