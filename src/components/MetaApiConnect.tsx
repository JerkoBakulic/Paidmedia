"use client";

import { useState, useEffect } from "react";
import type { MetaCampaign } from "@/types/meta";
import {
  fetchAdAccounts,
  fetchCampaignInsights,
  DATE_PRESET_LABELS,
  type MetaAdAccount,
  type DatePreset,
} from "@/lib/metaApi";
import { useFacebookSDK } from "@/lib/useFacebookSDK";
import { Loader2, Zap, ChevronDown, ChevronUp, LogOut, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onData: (campaigns: MetaCampaign[]) => void;
}

export function MetaApiConnect({ onData }: Props) {
  const [open, setOpen] = useState(false);
  const { status: fbStatus, token, login, logout } = useFacebookSDK();

  const [accounts, setAccounts] = useState<MetaAdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");
  const [level, setLevel] = useState<"campaign" | "adset" | "ad">("campaign");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Carga las cuentas automáticamente al conectarse
  useEffect(() => {
    if (!token) return;
    fetchAdAccounts(token)
      .then((accs) => {
        setAccounts(accs);
        if (accs.length > 0) setSelectedAccount(accs[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar cuentas"));
  }, [token]);

  const loadInsights = async () => {
    if (!token || !selectedAccount) return;
    setLoading(true);
    setError("");
    try {
      const campaigns = await fetchCampaignInsights(token, selectedAccount, datePreset, level);
      onData(campaigns);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al obtener datos");
    } finally {
      setLoading(false);
    }
  };

  const isConnected = fbStatus === "connected" && !!token;

  return (
    <div className="rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-accent/50 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span>Conectar Meta API</span>
          {isConnected ? (
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Conectado
            </span>
          ) : (
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
              Datos en tiempo real
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          : <ChevronDown className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 border-t flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>

          {/* Botón de login con Facebook */}
          {!isConnected ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                Iniciá sesión con tu cuenta de Meta para cargar las campañas directamente.
              </p>
              <button
                onClick={login}
                disabled={fbStatus === "loading"}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition"
                style={{ background: "#1877F2" }}
              >
                {fbStatus === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                )}
                Continuar con Facebook
              </button>
            </div>
          ) : (
            <>
              {/* Selector de cuenta, período y nivel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
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

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={loadInsights}
                  disabled={!selectedAccount || loading}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition",
                    "bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                  )}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</>
                    : <><RefreshCw className="w-4 h-4" /> Cargar campañas</>
                  }
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                >
                  <LogOut className="w-3.5 h-3.5" /> Desconectar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
