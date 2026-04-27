"use client";

import { useState, useCallback } from "react";
import type { MetaCampaign, InputMode } from "@/types/meta";
import { parseExcel, parsePaste } from "@/lib/excelParser";
import { Upload, ClipboardPaste, PenLine, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "@/lib/utils";

const MANUAL_FIELDS = [
  { key: "name", label: "Nombre", type: "text", required: true },
  { key: "spend", label: "Gasto ($)", type: "number" },
  { key: "impressions", label: "Impresiones", type: "number" },
  { key: "reach", label: "Alcance", type: "number" },
  { key: "clicks", label: "Clics", type: "number" },
  { key: "conversions", label: "Conversiones", type: "number" },
  { key: "conversionValue", label: "Valor conv. ($)", type: "number" },
];

const EMPTY_CAMPAIGN: Omit<MetaCampaign, "id" | "level"> = {
  name: "",
  status: "ACTIVE",
  spend: 0,
  impressions: 0,
  reach: 0,
  clicks: 0,
  conversions: 0,
  conversionValue: 0,
};

interface MetricsInputProps {
  onData: (campaigns: MetaCampaign[]) => void;
}

export function MetricsInput({ onData }: MetricsInputProps) {
  const [mode, setMode] = useState<InputMode>("excel");
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [manual, setManual] = useState({ ...EMPTY_CAMPAIGN });
  const [manualList, setManualList] = useState<MetaCampaign[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const processFile = useCallback(
    async (file: File) => {
      setError("");
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        setError("Formato no soportado. Usa .xlsx, .xls o .csv");
        return;
      }
      try {
        const buf = await file.arrayBuffer();
        const campaigns = parseExcel(buf);
        if (campaigns.length === 0) {
          setError("No se encontraron campañas en el archivo. Verifica los encabezados.");
          return;
        }
        setSuccess(`${campaigns.length} campañas cargadas desde "${file.name}"`);
        onData(campaigns);
      } catch {
        setError("Error al leer el archivo. Verifica que sea un Excel válido.");
      }
    },
    [onData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handlePaste = () => {
    setError("");
    if (!pasteText.trim()) { setError("Pega las métricas primero."); return; }
    const campaigns = parsePaste(pasteText);
    if (campaigns.length === 0) {
      setError("No se pudieron detectar campañas. Asegúrate de incluir encabezados en la primera fila.");
      return;
    }
    setSuccess(`${campaigns.length} campañas cargadas desde el texto pegado`);
    onData(campaigns);
    setPasteText("");
  };

  const addManual = () => {
    setError("");
    if (!manual.name.trim()) { setError("El nombre es obligatorio."); return; }
    const c: MetaCampaign = { ...manual, id: nanoid(), level: "campaign" };
    const updated = [...manualList, c];
    setManualList(updated);
    setManual({ ...EMPTY_CAMPAIGN });
    setSuccess(`"${c.name}" agregado`);
    onData(updated);
  };

  const removeManual = (id: string) => {
    const updated = manualList.filter((c) => c.id !== id);
    setManualList(updated);
    onData(updated);
  };

  const tabBtn = (m: InputMode, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => { setMode(m); setError(""); setSuccess(""); }}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        mode === m
          ? "bg-blue-500 text-white shadow"
          : "text-muted-foreground hover:bg-accent"
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      {/* Tabs */}
      <div className="flex gap-2 p-4 border-b" style={{ borderColor: "var(--border)" }}>
        {tabBtn("excel", <Upload className="w-4 h-4" />, "Subir Excel")}
        {tabBtn("paste", <ClipboardPaste className="w-4 h-4" />, "Pegar métricas")}
        {tabBtn("manual", <PenLine className="w-4 h-4" />, "Ingreso manual")}
      </div>

      <div className="p-4">
        {/* Feedback */}
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        {/* Excel mode */}
        {mode === "excel" && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all text-center",
              dragging
                ? "border-blue-500 bg-blue-500/10"
                : "border-border hover:border-blue-500/50 hover:bg-accent/40"
            )}
          >
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileInput} />
            <Upload className={cn("w-8 h-8", dragging ? "text-blue-400" : "text-muted-foreground")} />
            <div>
              <p className="font-semibold text-sm">Arrastrá el archivo o hacé clic para seleccionar</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                Soporta exportaciones de Meta Ads Manager (.xlsx, .xls, .csv)
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center text-xs" style={{ color: "var(--muted-foreground)" }}>
              {["Campaign Name", "Spend", "Impressions", "Reach", "Clicks", "Conversions", "ROAS"].map((f) => (
                <span key={f} className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--border)" }}>
                  {f}
                </span>
              ))}
            </div>
          </label>
        )}

        {/* Paste mode */}
        {mode === "paste" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Copiá y pegá directamente desde Meta Ads Manager (incluye encabezados). Formato TSV o CSV.
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              placeholder={"Campaign Name\tSpend\tImpressions\tReach\tClicks\tConversions\nCampaña Test\t1500\t45000\t12000\t890\t42"}
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono resize-none outline-none focus:ring-2 focus:ring-blue-500/40 transition"
              style={{
                background: "var(--accent)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
            <button
              onClick={handlePaste}
              className="self-start flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition"
            >
              <ClipboardPaste className="w-4 h-4" />
              Analizar métricas
            </button>
          </div>
        )}

        {/* Manual mode */}
        {mode === "manual" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
              {MANUAL_FIELDS.map(({ key, label, type }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    min={type === "number" ? "0" : undefined}
                    step={type === "number" ? "0.01" : undefined}
                    value={(manual as Record<string, unknown>)[key] as string | number}
                    onChange={(e) =>
                      setManual((prev) => ({
                        ...prev,
                        [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value,
                      }))
                    }
                    placeholder={label}
                    className="rounded-lg border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 transition"
                    style={{
                      background: "var(--accent)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addManual}
              className="self-start flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition"
            >
              <PenLine className="w-4 h-4" />
              Agregar campaña
            </button>

            {manualList.length > 0 && (
              <div className="rounded-lg border divide-y" style={{ borderColor: "var(--border)" }}>
                {manualList.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium">{c.name}</span>
                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span>${c.spend.toFixed(2)}</span>
                      <span>{c.impressions.toLocaleString()} imp.</span>
                      <button
                        onClick={() => removeManual(c.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
