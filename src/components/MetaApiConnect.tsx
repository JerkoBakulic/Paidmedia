"use client";

import { useState } from "react";
import type { MetaCampaign } from "@/types/meta";
import {
  fetchAdAccounts,
  fetchCampaignInsights,
  DATE_PRESET_LABELS,
  type MetaAdAccount,
  type DatePreset,
} from "@/lib/metaApi";
import { Loader2, Zap, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onData: (campaigns: MetaCampaign[]) => void;
}

export function MetaApiConnect({ onData }: Props) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [accounts, setAccounts] = useState<MetaAdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");
  const [level, setLevel] = useState<"campaign" | "adset" | "ad">("campaign");
  const [loading, setLoading] = useState<"accounts" | "insights" | null>(null);
  const [error, setError] = useState("");

  const loadAccounts = async () => {
    if (!token.trim()) return;
    setLoading("accounts");
    setError("");
    try {
      const accs = await fetchAdAccounts(token.trim());
      setAccounts(accs);
      if (accs.length > 0) setSelectedAccount(accs[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al conectar con Meta");
    } finally {
      setLoading(null);
    }
  };

  const loadInsights = async () => {
    if (!selectedAccount) return;
    setLoading("insights");
    setError("");
    try {
      const campaigns = await fetchCampaignInsights(token.trim(), selectedAccount, datePreset, level);
      onData(campaigns);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al obtener datos");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-accent/50 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span>Conectar Meta API</span>
          <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            Datos en tiempo real
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs mt-3" style={{ color: "var(--muted-foreground)" }}>
            Usá un <strong>User Access Token</strong> con permisos <code className="bg-accent px-1 rounded">ads_read</code>.
            Podés generarlo en el{" "}
            <a
              href="https://developers.facebook.com/tools/explorer/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
            >
              Graph API Explorer <ExternalLink className="w-3 h-3" />
            </a>.
          </p>

          {/* Token */}
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="EAAxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => { setToken(e.target.value); setAccounts([]); }}
              className="flex-1 rounded-lg border px-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/40 transition"
              style={{ background: "var(--accent)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <button
              onClick={loadAccounts}
              disabled={!token.trim() || loading === "accounts"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {loading === "accounts" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Verificar
            </button>
          </div>

          {/* Account selector */}
          {accounts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Cuenta</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{ background: "var(--accent)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Período</label>
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                  className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{ background: "var(--accent)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  {(Object.entries(DATE_PRESET_LABELS) as [DatePreset, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Nivel</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as "campaign" | "adset" | "ad")}
                  className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{ background: "var(--accent)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  <option value="campaign">Campaña</option>
                  <option value="adset">Ad Set</option>
                  <option value="ad">Anuncio</option>
                </select>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {accounts.length > 0 && (
            <button
              onClick={loadInsights}
              disabled={!selectedAccount || loading === "insights"}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition",
                "bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
              )}
            >
              {loading === "insights" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Cargando campañas...</>
              ) : (
                <><Zap className="w-4 h-4" /> Cargar campañas</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
