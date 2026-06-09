import { Sidebar } from "@/components/sidebar";
import { ContextSelector } from "@/components/context-selector";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MarketingContextProvider } from "@/lib/context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingContextProvider>
      <div className="flex min-h-screen bg-muted/30">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/70">
            <div className="mx-auto max-w-6xl px-6 py-3">
              <ContextSelector />
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </MarketingContextProvider>
  );
}
