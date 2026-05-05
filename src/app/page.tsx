"use client";

import { useState, useMemo, useCallback } from "react";
import type { MetaCampaign, MetaTargets, CampaignAnalysis, MetaLabels } from "@/types/meta";
import { DEFAULT_LABELS } from "@/types/meta";
import type { SavedReport, ReportTotals } from "@/types/report";
import { analyze, DEFAULT_TARGETS } from "@/lib/decisions";
import { MetricsInput } from "@/components/MetricsInput";
import { CampaignTable } from "@/components/CampaignTable";
import { KpiCard } from "@/components/KpiCard";
import { TargetsPanel } from "@/components/TargetsPanel";
import { PerformanceChart } from "@/components/PerformanceChart";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DecisionBadge } from "@/components/DecisionBadge";
import { ReportsPanel } from "@/components/ReportsPanel";
import { GitHubSettings } from "@/components/GitHubSettings";
import { InReportTrendChart } from "@/components/TrendChart";
import { BudgetPacing } from "@/components/BudgetPacing";
import { PlacementBreakdown } from "@/components/PlacementBreakdown";
import { BenchmarksPanel } from "@/components/BenchmarksPanel";
import { MetaApiConnect } from "@/components/MetaApiConnect";
import { ClientSwitcher } from "@/components/ClientSwitcher";
import { AlertsBell } from "@/components/AlertsBell";
import { CreativeFatigueChart } from "@/components/CreativeFatigueChart";
import { useReports } from "@/lib/useReports";
import { useWorkspace } from "@/lib/useWorkspace";
import { computeAlerts } from "@/lib/alerts";
import type { GitHubConfig } from "@/lib/githubStorage";
import { nanoid } from "@/lib/utils";
import {
  BarChart3, DollarSign, TrendingUp, Users,
  MousePointerClick, ShoppingCart, Zap, Trash2,
  BookMarked, Save, Loader2,
} from "lucide-react";
import {
  formatCurrencyCompact, formatCompact,
  formatPercent, formatRoas,
} from "@/lib/utils";

type MainTab = "analysis" | "reports";
type AnalysisTab = "table" | "charts";

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [labels, setLabels] = useState<MetaLabels>({});
  const [targets, setTargets] = useState<MetaTargets>(DEFAULT_TARGETS);
  const [mainTab, setMainTab] = useState<MainTab>("analysis");
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>("table");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);

  const {
    workspaces,
    activeWorkspace,
    createWorkspace,
    switchWorkspace,
    renameWorkspace,
    deleteWorkspace,
  } = useWorkspace();

  const { reports, save, remove, clear, syncing } = useReports(githubConfig, activeWorkspace.id);

  const alerts = useMemo(() => computeAlerts(reports), [reports]);

  // Analyzed campaigns con soporte de customTargets por campaña
  const analyzed = useMemo<CampaignAnalysis[]>(
    () => campaigns.map((c) => analyze(c, targets)),
    [campaigns, targets]
  );

  // Permite actualizar customTargets de una campaña y re-analizar
  const handleUpdateCampaignTargets = useCallback((id: string, customTargets: Partial<MetaTargets>) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, customTargets: Object.keys(customTargets).length > 0 ? customTargets : undefined }
          : c
      )
    );
  }, []);

  const totals = useMemo<ReportTotals>(() => {
    const spend = analyzed.reduce((s, c) => s + c.spend, 0);
    const impressions = analyzed.reduce((s, c) => s + c.impressions, 0);
    const reach = analyzed.reduce((s, c) => s + c.reach, 0);
    const clicks = analyzed.reduce((s, c) => s + c.clicks, 0);
    const conversions = analyzed.reduce((s, c) => s + c.conversions, 0);
    const conversionValue = analyzed.reduce((s, c) => s + c.conversionValue, 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const roas = spend > 0 && conversionValue > 0 ? conversionValue / spend : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const avgFreq = reach > 0 ? impressions / reach : 0;
    return { spend, impressions, reach, clicks, conversions, conversionValue, ctr, cpa, roas, cpm, avgFreq };
  }, [analyzed]);

  const decisionCounts = useMemo(() => ({
    SCALE: analyzed.filter((c) => c.decision === "SCALE").length,
    MONITOR: analyzed.filter((c) => c.decision === "MONITOR").length,
    OPTIMIZE: analyzed.filter((c) => c.decision === "OPTIMIZE").length,
    TEST: analyzed.filter((c) => c.decision === "TEST").length,
    PAUSE: analyzed.filter((c) => c.decision === "PAUSE").length,
  }), [analyzed]);

  const handleSaveReport = useCallback(() => {
    if (analyzed.length === 0) return;
    const name = prompt("Nombre del reporte:", `Reporte ${new Date().toLocaleDateString("es")}`);
    if (!name) return;
    setSaving(true);
    const report: SavedReport = {
      id: nanoid(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      campaigns: analyzed,
      targets,
      totals,
      decisionCounts,
      labels,
    };
    save(report);
    setSavedMsg(`"${name}" guardado`);
    setTimeout(() => { setSaving(false); setSavedMsg(""); }, 2500);
  }, [analyzed, targets, totals, decisionCounts, labels, save]);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-sm"
        style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--card) 90%, transparent)" }}
      >
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Paid Media Analyzer</h1>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Meta Ads · Análisis de campañas</p>
            </div>
            <ClientSwitcher
              workspaces={workspaces}
              active={activeWorkspace}
              onCreate={createWorkspace}
              onSwitch={switchWorkspace}
              onRename={renameWorkspace}
              onDelete={deleteWorkspace}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setMainTab("analysis")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: mainTab === "analysis" ? "var(--primary)" : "transparent",
                  color: mainTab === "analysis" ? "white" : "var(--muted-foreground)",
                }}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Análisis
              </button>
              <button
                onClick={() => setMainTab("reports")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all relative"
                style={{
                  background: mainTab === "reports" ? "var(--primary)" : "transparent",
                  color: mainTab === "reports" ? "white" : "var(--muted-foreground)",
                }}
              >
                <BookMarked className="w-3.5 h-3.5" /> Reportes
                {reports.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {reports.length}
                  </span>
                )}
              </button>
            </div>

            <AlertsBell alerts={alerts} />

            {syncing && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <Loader2 className="w-3 h-3 animate-spin" /> Sincronizando…
              </span>
            )}

            {analyzed.length > 0 && mainTab === "analysis" && (
              <>
                {savedMsg ? (
                  <span className="text-xs text-emerald-400 font-medium">{savedMsg}</span>
                ) : (
                  <button
                    onClick={handleSaveReport}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition"
                  >
                    <Save className="w-3.5 h-3.5" /> Guardar reporte
                  </button>
                )}
                <button
                  onClick={() => { setCampaigns([]); setLabels({}); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpiar
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ANALYSIS TAB */}
        {mainTab === "analysis" && (
          <>
            <section className="flex flex-col gap-3">
              <TargetsPanel targets={targets} onChange={setTargets} />
              <MetaApiConnect onData={(c) => { setCampaigns(c); setLabels({}); }} />
              <MetricsInput onData={(c, l) => { setCampaigns(c); if (Object.keys(l).length > 0) setLabels(l); }} />
            </section>

            {campaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: "var(--accent)" }}>
                  <BarChart3 className="w-8 h-8" style={{ color: "var(--muted-foreground)" }} />
                </div>
                <div>
                  <p className="font-semibold text-lg">Sin datos de campañas</p>
                  <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                    Conectá la Meta API, subí un Excel o pegá las métricas
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {["Campaign Name", "Amount Spent", "Impressions", "Reach", "Link Clicks", "Website Purchases", "Purchase ROAS", "Purchase Conversion Value"].map((hint) => (
                    <span key={hint} className="text-xs rounded-full border px-2 py-1" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                      {hint}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analyzed.length > 0 && (
              <>
                {/* Budget pacing */}
                <BudgetPacing totalSpend={totals.spend} />

                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                    {analyzed.length} {analyzed.length === 1 ? "campaña analizada" : "campañas analizadas"}
                  </span>
                  {(["SCALE", "MONITOR", "OPTIMIZE", "TEST", "PAUSE"] as const).map((d) =>
                    decisionCounts[d] > 0 ? (
                      <div key={d} className="flex items-center gap-1.5">
                        <DecisionBadge decision={d} />
                        <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>×{decisionCounts[d]}</span>
                      </div>
                    ) : null
                  )}
                </div>

                {/* KPI Cards */}
                {(() => {
                  const L = { ...DEFAULT_LABELS, ...labels };
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
                      <KpiCard label={L.spend ?? "Gasto"} value={formatCurrencyCompact(totals.spend)} icon={<DollarSign className="w-4 h-4" />} highlight />
                      <KpiCard label={L.roas ?? "ROAS"} value={totals.roas > 0 ? formatRoas(totals.roas) : "—"} icon={<TrendingUp className="w-4 h-4" />} trend={totals.roas > 0 ? (totals.roas >= targets.roas ? "up" : "down") : "neutral"} sub={`Obj: ${targets.roas}x`} />
                      <KpiCard label={L.cpa ?? "CPA"} value={totals.cpa > 0 ? formatCurrencyCompact(totals.cpa) : "—"} icon={<ShoppingCart className="w-4 h-4" />} trend={totals.cpa > 0 ? (totals.cpa <= targets.cpa ? "up" : "down") : "neutral"} sub={`Obj: $${targets.cpa}`} />
                      <KpiCard label={L.ctr ?? "CTR"} value={formatPercent(totals.ctr)} icon={<MousePointerClick className="w-4 h-4" />} trend={totals.ctr >= targets.ctr ? "up" : "down"} sub={`Obj: ${targets.ctr}%`} />
                      <KpiCard label={L.cpm ?? "CPM"} value={formatCurrencyCompact(totals.cpm)} icon={<Zap className="w-4 h-4" />} />
                      <KpiCard label={L.reach ?? "Alcance"} value={formatCompact(totals.reach)} icon={<Users className="w-4 h-4" />} sub={`${L.frequency ?? "Freq."} ${totals.avgFreq.toFixed(1)}`} />
                      <KpiCard label={L.conversions ?? "Conversiones"} value={formatCompact(totals.conversions)} icon={<ShoppingCart className="w-4 h-4" />} />
                      <KpiCard label={L.conversionValue ?? "Valor conv."} value={formatCurrencyCompact(totals.conversionValue)} icon={<DollarSign className="w-4 h-4" />} />
                    </div>
                  );
                })()}

                {/* Benchmarks */}
                <BenchmarksPanel totals={totals} targets={targets} />

                <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
                  {(["table", "charts"] as const).map((tab) => (
                    <button key={tab} onClick={() => setAnalysisTab(tab)} className="px-4 py-2 text-sm font-medium transition-all -mb-px border-b-2"
                      style={{ borderBottomColor: analysisTab === tab ? "var(--primary)" : "transparent", color: analysisTab === tab ? "var(--primary)" : "var(--muted-foreground)" }}>
                      {tab === "table" ? "Tabla de campañas" : "Gráficos"}
                    </button>
                  ))}
                </div>

                {analysisTab === "table" && (
                  <CampaignTable
                    data={analyzed}
                    labels={labels}
                    onUpdateTargets={handleUpdateCampaignTargets}
                  />
                )}
                {analysisTab === "charts" && (
                  <div className="flex flex-col gap-4">
                    <PerformanceChart data={analyzed} />
                    <CreativeFatigueChart data={analyzed} maxFrequency={targets.maxFrequency} targetCtr={targets.ctr} />
                    <PlacementBreakdown data={analyzed} />
                    <InReportTrendChart campaigns={analyzed} />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* REPORTS TAB */}
        {mainTab === "reports" && (
          <div className="flex flex-col gap-4">
            <GitHubSettings onConfigChange={setGithubConfig} />
            <ReportsPanel reports={reports} onDelete={remove} onClear={clear} />
          </div>
        )}
      </main>

      <footer className="mt-auto border-t py-4 text-center text-xs" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
        Paid Media Analyzer · Meta Ads · 2025
      </footer>
    </div>
  );
}
