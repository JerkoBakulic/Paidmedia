export interface MetaCampaign {
  id: string;
  name: string;
  objective?: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  frequency?: number;
  cpm?: number;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  roas?: number;
  level: "campaign" | "adset" | "ad";
  parentName?: string;
}

export interface MetaTargets {
  roas: number;
  cpa: number;
  ctr: number;
  cpm: number;
  maxFrequency: number;
}

export type Decision = "SCALE" | "PAUSE" | "OPTIMIZE" | "TEST" | "MONITOR";

export interface CampaignAnalysis extends MetaCampaign {
  decision: Decision;
  alerts: string[];
  score: number;
}

export type InputMode = "manual" | "excel" | "paste";

export interface MetricConfig {
  key: keyof MetaCampaign;
  label: string;
  format: "currency" | "percent" | "number" | "text";
  description: string;
}
