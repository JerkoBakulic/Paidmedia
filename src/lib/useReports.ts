"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SavedReport } from "@/types/report";
import type { GitHubConfig } from "@/lib/githubStorage";
import { githubRead, githubWrite, loadCachedSha, saveCachedSha } from "@/lib/githubStorage";

const KEY = "paidmedia_reports";

export function useReports(githubCfg?: GitHubConfig | null) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [syncing, setSyncing] = useState(false);
  const cfgRef = useRef(githubCfg);
  cfgRef.current = githubCfg;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setReports(JSON.parse(raw));
    } catch {
      setReports([]);
    }
  }, []);

  // Sync from GitHub when config becomes available
  useEffect(() => {
    if (!githubCfg) return;
    setSyncing(true);
    githubRead(githubCfg)
      .then(({ reports: ghReports, sha }) => {
        if (sha) saveCachedSha(sha);
        if (ghReports.length > 0) {
          setReports(ghReports);
          localStorage.setItem(KEY, JSON.stringify(ghReports));
        }
      })
      .catch(console.error)
      .finally(() => setSyncing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubCfg?.token, githubCfg?.owner, githubCfg?.repo, githubCfg?.path]);

  const syncToGitHub = useCallback(async (updated: SavedReport[]) => {
    const cfg = cfgRef.current;
    if (!cfg) return;
    try {
      const sha = loadCachedSha();
      const newSha = await githubWrite(cfg, updated, sha);
      if (newSha) saveCachedSha(newSha);
    } catch (e) {
      console.error("GitHub sync failed:", e);
    }
  }, []);

  const save = useCallback((report: SavedReport) => {
    setReports((prev) => {
      const updated = [report, ...prev];
      localStorage.setItem(KEY, JSON.stringify(updated));
      syncToGitHub(updated);
      return updated;
    });
  }, [syncToGitHub]);

  const remove = useCallback((id: string) => {
    setReports((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem(KEY, JSON.stringify(updated));
      syncToGitHub(updated);
      return updated;
    });
  }, [syncToGitHub]);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setReports([]);
    syncToGitHub([]);
  }, [syncToGitHub]);

  return { reports, save, remove, clear, syncing };
}
