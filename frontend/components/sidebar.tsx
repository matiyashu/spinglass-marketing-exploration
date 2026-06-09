"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Beaker,
  BookOpen,
  ClipboardCheck,
  Database,
  FileBarChart,
  FileText,
  FlaskConical,
  GitCompare,
  HelpCircle,
  Home,
  Layers,
  LineChart,
  Network,
  Radio,
  Shield,
  Sparkles,
  Split,
  Target,
  TrendingUp,
  Upload,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace, SHOW_BENCHMARK, type Workspace } from "@/lib/workspace";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { href: "/dashboard", label: "Home", icon: Home },
      { href: "/dashboard/data", label: "Data setup", icon: Database },
      { href: "/dashboard/upload", label: "Import & validation", icon: Upload },
      { href: "/dashboard/method-status", label: "Method status", icon: ClipboardCheck },
      { href: "/dashboard/faq", label: "FAQ", icon: HelpCircle },
    ],
  },
  {
    title: "Brand portfolio",
    items: [
      { href: "/dashboard/brands", label: "Portfolio overview", icon: Layers },
      { href: "/dashboard/brands/memory-map", label: "Brand memory map", icon: Network },
      { href: "/dashboard/brands/tensions", label: "Brand tensions", icon: Split },
      { href: "/dashboard/brands/competitive-leakage", label: "Competitive leakage", icon: Shield },
    ],
  },
  {
    title: "Product / vertical",
    items: [
      { href: "/dashboard/verticals", label: "Vertical overview", icon: TrendingUp },
      { href: "/dashboard/verticals/product-memory-fit", label: "Product memory fit", icon: Target },
      { href: "/dashboard/verticals/segment-differences", label: "Segment differences", icon: Users },
      { href: "/dashboard/verticals/switching-risk", label: "Switching risk", icon: GitCompare },
    ],
  },
  {
    title: "Campaigns",
    items: [
      { href: "/dashboard/campaigns", label: "Campaign overview", icon: Radio },
      { href: "/dashboard/campaigns/creative-memory", label: "Creative memory pattern", icon: Sparkles },
      { href: "/dashboard/campaigns/field-response", label: "Field response", icon: Zap },
      { href: "/dashboard/campaigns/simulator", label: "Scenario simulator", icon: Beaker },
      { href: "/dashboard/campaigns/validation", label: "Observed validation", icon: ClipboardCheck },
    ],
  },
  {
    title: "Dynamics & stability",
    items: [
      { href: "/dashboard/dynamics/rolling-regime", label: "Rolling regime", icon: LineChart },
      { href: "/dashboard/dynamics/persistence", label: "Memory persistence", icon: Activity },
      { href: "/dashboard/dynamics/replicas", label: "Replica / fragmentation", icon: Workflow },
      { href: "/dashboard/dynamics/stress-test", label: "Stress test", icon: Shield },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/dashboard/reports/executive", label: "Executive report", icon: FileBarChart },
      { href: "/dashboard/reports/technical-appendix", label: "Technical appendix", icon: FileText },
    ],
  },
  {
    title: "Methods",
    items: [
      { href: "/dashboard/methods/glossary", label: "Model glossary", icon: BookOpen },
      { href: "/dashboard/theory", label: "Theory explainers", icon: FlaskConical },
      ...(SHOW_BENCHMARK
        ? [{ href: "/dashboard/commodity", label: "Paper benchmark", icon: LineChart }]
        : []),
    ],
  },
];

const WORKSPACE_BUTTONS: { ws: Workspace; label: string; tone: string }[] = [
  { ws: "demo", label: "Demo", tone: "text-primary" },
  { ws: "live", label: "Live", tone: "text-foreground" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [workspace, setWorkspace] = useWorkspace();
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
          <Network className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight tracking-tight">Spin-Glass</p>
          <p className="text-[11px] text-muted-foreground leading-tight">Brand Memory &amp; Campaign Dynamics</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors",
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-4 space-y-2 text-[11px] text-muted-foreground">
        <p className="font-semibold uppercase tracking-widest text-muted-foreground/80">Workspace</p>
        <div className="flex rounded-md border bg-muted/50 p-0.5">
          {WORKSPACE_BUTTONS.map((b) => (
            <button
              key={b.ws}
              type="button"
              onClick={() => setWorkspace(b.ws)}
              className={cn(
                "flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
                workspace === b.ws ? `bg-card ${b.tone} shadow-sm` : "text-muted-foreground hover:text-foreground",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span className={cn("h-1.5 w-1.5 rounded-full", workspace === "demo" ? "bg-emerald-500" : "bg-amber-500")} />
          <span>{workspace === "demo" ? "Bundled demo dataset" : "Live compute via FastAPI"}</span>
        </div>
        <Link href="/" className="block pt-1 hover:text-foreground transition-colors">
          ← back to landing
        </Link>
      </div>
    </aside>
  );
}
