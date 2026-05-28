"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  ClipboardList,
  FileBarChart,
  Flame,
  HelpCircle,
  Home,
  MountainSnow,
  Network,
  Sparkles,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMode } from "@/lib/mode";

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
    title: "Get started",
    items: [
      { href: "/dashboard", label: "Overview", icon: Home },
      { href: "/dashboard/data-requirements", label: "Data requirements", icon: ClipboardList },
      { href: "/dashboard/upload", label: "Upload data", icon: Upload },
      { href: "/dashboard/faq", label: "FAQ", icon: HelpCircle },
    ],
  },
  {
    title: "Analysis",
    items: [
      { href: "/dashboard/couplings", label: "Couplings", icon: Network },
      { href: "/dashboard/memory", label: "Memory & campaign", icon: Sparkles },
      { href: "/dashboard/scenarios", label: "Scenarios", icon: BookOpen },
      { href: "/dashboard/landscape", label: "Energy landscape", icon: MountainSnow },
      { href: "/dashboard/pulse", label: "Pulse response", icon: Activity },
    ],
  },
  {
    title: "Output",
    items: [{ href: "/dashboard/reports", label: "Reports", icon: FileBarChart }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mode, setMode] = useMode();
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
          <Flame className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight tracking-tight">Spin-Glass</p>
          <p className="text-[11px] text-muted-foreground leading-tight">Marketing exploration</p>
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
        <p className="font-semibold uppercase tracking-widest text-muted-foreground/80">Mode</p>
        <div className="flex rounded-md border bg-muted/50 p-0.5">
          <button
            type="button"
            onClick={() => setMode("demo")}
            className={cn(
              "flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
              mode === "demo" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Demo
          </button>
          <button
            type="button"
            onClick={() => setMode("live")}
            className={cn(
              "flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
              mode === "live" ? "bg-card text-blue-700 shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Live
          </button>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              mode === "demo" ? "bg-emerald-500" : "bg-blue-500",
            )}
          />
          <span>
            {mode === "demo" ? "Showing bundled example data" : "Awaiting your uploaded data"}
          </span>
        </div>
        <Link href="/" className="block pt-1 hover:text-foreground transition-colors">
          ← back to landing
        </Link>
      </div>
    </aside>
  );
}
