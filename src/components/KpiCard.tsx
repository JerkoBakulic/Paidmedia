import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
  highlight?: boolean;
}

export function KpiCard({ label, value, sub, trend, icon, highlight }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex flex-col gap-2 transition-all",
        highlight
          ? "bg-blue-500/10 border-blue-500/30"
          : "bg-card border-border hover:border-border/80"
      )}
      style={{ backgroundColor: highlight ? undefined : "var(--card)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </span>
        {icon && (
          <span className="text-muted-foreground opacity-60 w-4 h-4">{icon}</span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium mb-0.5",
              trend === "up" && "text-emerald-400",
              trend === "down" && "text-red-400",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
          </span>
        )}
      </div>
      {sub && (
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}
