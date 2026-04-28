import type { MetaCampaign } from "@/types/meta";
import { nanoid } from "./utils";

const GRAPH = "https://graph.facebook.com/v19.0";

export interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
}

export type DatePreset =
  | "today"
  | "yesterday"
  | "last_7d"
  | "last_14d"
  | "last_30d"
  | "this_month"
  | "last_month";

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  last_7d: "Últimos 7 días",
  last_14d: "Últimos 14 días",
  last_30d: "Últimos 30 días",
  this_month: "Este mes",
  last_month: "Mes anterior",
};

export async function fetchAdAccounts(token: string): Promise<MetaAdAccount[]> {
  const res = await fetch(
    `${GRAPH}/me/adaccounts?fields=id,name,currency&limit=50&access_token=${token}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Error ${res.status}`);
  }
  const data = await res.json();
  return (data.data ?? []) as MetaAdAccount[];
}

interface RawInsight {
  campaign_id?: string;
  campaign_name?: string;
  adset_name?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpm?: string;
  cpc?: string;
  frequency?: string;
  date_start?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
  purchase_roas?: { action_type: string; value: string }[];
}

function parseNum(v?: string): number {
  return v ? parseFloat(v) || 0 : 0;
}

function getActionValue(
  arr: { action_type: string; value: string }[] | undefined,
  type: string
): number {
  const item = arr?.find((a) => a.action_type === type);
  return item ? parseFloat(item.value) || 0 : 0;
}

export async function fetchCampaignInsights(
  token: string,
  accountId: string,
  datePreset: DatePreset,
  level: "campaign" | "adset" | "ad" = "campaign"
): Promise<MetaCampaign[]> {
  const fields = [
    "campaign_name",
    "adset_name",
    "ad_name",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpm",
    "cpc",
    "frequency",
    "date_start",
    "actions",
    "action_values",
    "purchase_roas",
  ].join(",");

  const id = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  const url =
    `${GRAPH}/${id}/insights?fields=${fields}&level=${level}` +
    `&date_preset=${datePreset}&limit=100&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Error ${res.status}`);
  }
  const data = await res.json();
  const rows: RawInsight[] = data.data ?? [];

  return rows.map((r): MetaCampaign => {
    const conversions =
      getActionValue(r.actions, "purchase") ||
      getActionValue(r.actions, "offsite_conversion.fb_pixel_purchase") ||
      getActionValue(r.actions, "omni_purchase");
    const conversionValue =
      getActionValue(r.action_values, "purchase") ||
      getActionValue(r.action_values, "omni_purchase");
    const roasRaw = r.purchase_roas?.[0]?.value;
    const roas = roasRaw ? parseFloat(roasRaw) : undefined;

    const name =
      level === "campaign"
        ? (r.campaign_name ?? "Campaña")
        : level === "adset"
        ? (r.adset_name ?? "Ad Set")
        : (r.ad_name ?? "Anuncio");

    return {
      id: nanoid(),
      name,
      status: "ACTIVE",
      date: r.date_start,
      spend: parseNum(r.spend),
      impressions: parseNum(r.impressions),
      reach: parseNum(r.reach),
      clicks: parseNum(r.clicks),
      conversions,
      conversionValue,
      frequency: parseNum(r.frequency) || undefined,
      cpm: parseNum(r.cpm) || undefined,
      ctr: parseNum(r.ctr) || undefined,
      cpc: parseNum(r.cpc) || undefined,
      roas,
      cpa: conversions > 0 ? parseNum(r.spend) / conversions : undefined,
      level,
    };
  });
}
