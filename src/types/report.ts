import type { CampaignAnalysis, MetaTargets, MetaLabels } from "./meta";

export interface ReportTotals {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  cpa: number;
  roas: number;
  cpm: number;
  avgFreq: number;
}

export interface SavedReport {
  id: string;
  name: string;
  createdAt: string;
  campaigns: CampaignAnalysis[];
  targets: MetaTargets;
  totals: ReportTotals;
  decisionCounts: {
    SCALE: number;
    MONITOR: number;
    OPTIMIZE: number;
    TEST: number;
    PAUSE: number;
  };
  labels?: MetaLabels;
}
