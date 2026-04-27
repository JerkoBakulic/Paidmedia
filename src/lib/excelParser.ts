import * as XLSX from "xlsx";
import type { MetaCampaign } from "@/types/meta";
import { nanoid } from "./utils";

const FIELD_MAP: Record<string, keyof MetaCampaign> = {
  // Nombre / campaign name
  "campaign name": "name",
  "ad set name": "name",
  "ad name": "name",
  nombre: "name",
  campaña: "name",
  "nombre de la campaña": "name",
  "nombre del conjunto de anuncios": "name",
  "conjunto de anuncios": "name",
  "nombre del anuncio": "name",
  anuncio: "name",

  // Gasto / spend — con variantes de moneda (clp, usd, ars, etc.)
  amount_spent: "spend",
  "amount spent": "spend",
  "importe gastado": "spend",
  gasto: "spend",
  spend: "spend",

  // Impresiones
  impressions: "impressions",
  impresiones: "impressions",

  // Alcance
  reach: "reach",
  alcance: "reach",

  // Clics
  clicks: "clicks",
  "link clicks": "clicks",
  "clics en el enlace": "clicks",
  clics: "clicks",

  // Conversiones / resultados
  conversions: "conversions",
  resultados: "conversions",
  "website purchases": "conversions",
  "compras en el sitio web": "conversions",
  conversiones: "conversions",

  // CPA / costo por resultado
  "costo por resultados": "cpa",
  "cost per result": "cpa",
  cpa: "cpa",

  // ROAS
  "purchase roas (return on ad spend)": "roas",
  "website purchase roas": "roas",
  roas: "roas",

  // Valor de conversión
  "conversion values": "conversionValue",
  "purchase conversion value": "conversionValue",
  "valor de conversión de compras": "conversionValue",
  "valor de conversión": "conversionValue",
  "conversion value": "conversionValue",

  // Frecuencia
  frequency: "frequency",
  frecuencia: "frequency",

  // CPM — con variantes de moneda
  cpm: "cpm",

  // CTR / CPC
  ctr: "ctr",
  cpc: "cpc",

  // Estado / entrega
  status: "status",
  estado: "status",
  "entrega del conjunto de anuncios": "status",
  "ad set delivery": "status",
  "campaign delivery": "status",
  "entrega de la campaña": "status",

  // Objetivo
  objective: "objective",
  objetivo: "objective",
  "indicador de resultado": "objective",
  "result indicator": "objective",
};

// Normaliza el encabezado: minúsculas, sin espacios dobles,
// y elimina sufijos de moneda como "(CLP)", "(USD)", "(ARS)", etc.
function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .replace(/\s*\([a-z]{3}\)\s*/gi, " ") // quita "(CLP)", "(USD)", etc.
    .replace(/\s*\(costo por mil impresiones\)\s*/gi, " ") // quita descripción CPM
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[$,%\s]/g, "");
  return parseFloat(s) || 0;
}

export function parseExcel(buffer: ArrayBuffer): MetaCampaign[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const mapping: Record<string, keyof MetaCampaign> = {};

  for (const h of headers) {
    const norm = normalizeHeader(h);
    if (FIELD_MAP[norm]) {
      mapping[h] = FIELD_MAP[norm];
    }
  }

  return rows
    .filter((row) => Object.values(row).some((v) => v !== ""))
    .map((row) => {
      const campaign: MetaCampaign = {
        id: nanoid(),
        name: "",
        status: "ACTIVE",
        spend: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        conversions: 0,
        conversionValue: 0,
        level: "campaign",
      };

      for (const [header, field] of Object.entries(mapping)) {
        const val = row[header];
        if (field === "name" || field === "status" || field === "objective") {
          (campaign as unknown as Record<string, unknown>)[field] = String(val || "").trim();
        } else {
          (campaign as unknown as Record<string, unknown>)[field] = parseNumber(val);
        }
      }

      if (!campaign.name) campaign.name = `Fila ${rows.indexOf(row) + 1}`;
      return campaign;
    })
    .filter((c) => c.name && (c.spend > 0 || c.impressions > 0));
}

export function parsePaste(text: string): MetaCampaign[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.replace(/"/g, "").trim());

  const mapping: Record<number, keyof MetaCampaign> = {};
  headers.forEach((h, i) => {
    const norm = normalizeHeader(h);
    if (FIELD_MAP[norm]) mapping[i] = FIELD_MAP[norm];
  });

  return lines
    .slice(1)
    .map((line) => {
      const cells = line.split(delimiter).map((c) => c.replace(/"/g, "").trim());
      const campaign: MetaCampaign = {
        id: nanoid(),
        name: "",
        status: "ACTIVE",
        spend: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        conversions: 0,
        conversionValue: 0,
        level: "campaign",
      };

      for (const [idx, field] of Object.entries(mapping)) {
        const val = cells[Number(idx)];
        if (field === "name" || field === "status" || field === "objective") {
          (campaign as unknown as Record<string, unknown>)[field] = val || "";
        } else {
          (campaign as unknown as Record<string, unknown>)[field] = parseNumber(val);
        }
      }

      if (!campaign.name) campaign.name = `Fila ${lines.indexOf(line)}`;
      return campaign;
    })
    .filter((c) => c.name && (c.spend > 0 || c.impressions > 0));
}
