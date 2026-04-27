"use client";

import type { CampaignAnalysis } from "@/types/meta";
import { DecisionBadge } from "./DecisionBadge";
import { formatCurrency, formatNumber, formatPercent, formatRoas } from "@/lib/utils";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SortKey = keyof CampaignAnalysis;

interface CampaignTableProps {
  data: CampaignAnalysis[];
}

const SCORE_COLOR = (s: number) => {
  if (s >= 75) return "text-emerald-400";
  if (s >= 55) return "text-blue-400";
  if (s >= 40) return "text-yellow-400";
  if (s >= 25) return "text-orange-400";
  return "text-red-400";
};

export function CampaignTable({ data }: CampaignTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...data].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[sortKey] ?? 0;
    const bv = (b as unknown as Record<string, unknown>)[sortKey] ?? 0;
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3 opacity-30" />
    );

  const th = (label: string, k: SortKey) => (
    <th
      onClick={() => handleSort(k)}
      className="text-left px-3 py-2.5 text-xs font-semibold cursor-pointer select-none whitespace-nowrap hover:opacity-80 transition"
      style={{ color: "var(--muted-foreground)" }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon k={k} />
      </span>
    </th>
  );

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--accent)", borderBottom: "1px solid var(--border)" }}>
              {th("Campaña", "name")}
              {th("Decisión", "decision")}
              {th("Score", "score")}
              {th("Gasto", "spend")}
              {th("ROAS", "roas")}
              {th("CPA", "cpa")}
              {th("CTR", "ctr")}
              {th("CPM", "cpm")}
              {th("Freq.", "frequency")}
              {th("Conv.", "conversions")}
              <th className="px-3 py-2.5 text-xs font-semibold text-right" style={{ color: "var(--muted-foreground)" }}>
                Alertas
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <>
                <tr
                  key={c.id}
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  className={cn(
                    "cursor-pointer transition-colors border-b",
                    i % 2 === 0 ? "bg-card" : "bg-accent/30",
                    "hover:bg-accent/60"
                  )}
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-3 py-3 font-medium max-w-[200px] truncate">
                    {c.name}
                  </td>
                  <td className="px-3 py-3">
                    <DecisionBadge decision={c.decision} />
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("font-bold", SCORE_COLOR(c.score))}>{c.score}</span>
                  </td>
                  <td className="px-3 py-3 font-medium">{formatCurrency(c.spend)}</td>
                  <td className="px-3 py-3">
                    {c.roas ? (
                      <span className={cn("font-semibold", c.roas >= 2 ? "text-emerald-400" : c.roas >= 1 ? "text-yellow-400" : "text-red-400")}>
                        {formatRoas(c.roas)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-3">
                    {c.cpa ? formatCurrency(c.cpa) : "—"}
                  </td>
                  <td className="px-3 py-3">
                    {c.ctr !== undefined ? formatPercent(c.ctr) : "—"}
                  </td>
                  <td className="px-3 py-3">
                    {c.cpm ? formatCurrency(c.cpm) : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn(
                      c.frequency && c.frequency > 3.5 ? "text-orange-400 font-semibold" : "",
                      c.frequency && c.frequency > 5 ? "text-red-400 font-bold" : ""
                    )}>
                      {c.frequency ? c.frequency.toFixed(1) : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3">{formatNumber(c.conversions)}</td>
                  <td className="px-3 py-3 text-right">
                    {c.alerts.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {c.alerts.length}
                      </span>
                    )}
                  </td>
                </tr>
                {expanded === c.id && c.alerts.length > 0 && (
                  <tr key={`${c.id}-alerts`} style={{ borderColor: "var(--border)" }} className="border-b">
                    <td colSpan={11} className="px-4 py-3" style={{ background: "var(--accent)" }}>
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
                          Alertas y recomendaciones:
                        </p>
                        {c.alerts.map((alert, ai) => (
                          <div key={ai} className="flex items-start gap-2 text-xs text-orange-300">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            {alert}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
