"use client";

import { BarChart3, BookMarked, Table2, LineChart, Layers, Settings2, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type MainTab = "analysis" | "reports";
type AnalysisTab = "table" | "charts" | "structure";

interface SidebarProps {
  mainTab: MainTab;
  analysisTab: AnalysisTab;
  onMainTab: (tab: MainTab) => void;
  onAnalysisTab: (tab: AnalysisTab) => void;
  hasData: boolean;
  hasMetaConnection: boolean;
  reportsCount: number;
}

const ANALYSIS_TABS: { key: AnalysisTab; label: string; icon: React.ReactNode; requiresMeta?: boolean }[] = [
  { key: "table",     label: "Tabla de campañas", icon: <Table2  className="w-3.5 h-3.5" /> },
  { key: "charts",    label: "Gráficos",           icon: <LineChart className="w-3.5 h-3.5" /> },
  { key: "structure", label: "Estructura",         icon: <Layers  className="w-3.5 h-3.5" />, requiresMeta: true },
];

function NavContent({ mainTab, analysisTab, onMainTab, onAnalysisTab, hasData, hasMetaConnection, reportsCount, onClose }: SidebarProps & { onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500 shrink-0">
          <BarChart3 className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight truncate">Paid Media</p>
          <p className="text-[10px] leading-tight truncate" style={{ color: "var(--muted-foreground)" }}>Meta Ads Analyzer</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded" style={{ color: "var(--muted-foreground)" }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {/* Análisis */}
        <button
          onClick={() => { onMainTab("analysis"); onClose?.(); }}
          className={cn(
            "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all",
            mainTab === "analysis"
              ? "bg-blue-500/10 text-blue-400"
              : "hover:bg-accent/60"
          )}
          style={mainTab !== "analysis" ? { color: "var(--foreground)" } : undefined}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          Análisis
        </button>

        {/* Sub-ítems de Análisis — solo cuando hay datos */}
        {mainTab === "analysis" && hasData && (
          <div className="ml-4 pl-2 border-l flex flex-col gap-0.5 mt-0.5" style={{ borderColor: "var(--border)" }}>
            {ANALYSIS_TABS.filter((t) => !t.requiresMeta || hasMetaConnection).map((t) => (
              <button
                key={t.key}
                onClick={() => { onAnalysisTab(t.key); onClose?.(); }}
                className={cn(
                  "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  analysisTab === t.key
                    ? "bg-blue-500/10 text-blue-400"
                    : "hover:bg-accent/60"
                )}
                style={analysisTab !== t.key ? { color: "var(--muted-foreground)" } : undefined}
              >
                {t.icon}
                {t.label}
                {analysisTab === t.key && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </div>
        )}

        <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />

        {/* Reportes */}
        <button
          onClick={() => { onMainTab("reports"); onClose?.(); }}
          className={cn(
            "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all",
            mainTab === "reports"
              ? "bg-blue-500/10 text-blue-400"
              : "hover:bg-accent/60"
          )}
          style={mainTab !== "reports" ? { color: "var(--foreground)" } : undefined}
        >
          <BookMarked className="w-4 h-4 shrink-0" />
          Reportes
          {reportsCount > 0 && (
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white min-w-[18px] text-center">
              {reportsCount}
            </span>
          )}
        </button>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-[10px]" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
        Paid Media Analyzer · 2025
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button — visible solo en mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 flex items-center justify-center w-8 h-8 rounded-lg border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-56 border-r transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <NavContent {...props} onClose={() => setMobileOpen(false)} />
      </div>

      {/* Desktop sidebar — siempre visible */}
      <aside
        className="hidden md:flex flex-col w-52 shrink-0 border-r sticky top-0 h-screen"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <NavContent {...props} />
      </aside>
    </>
  );
}
