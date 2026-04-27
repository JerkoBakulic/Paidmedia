"use client";

import { useState, useEffect, useCallback } from "react";
import type { SavedReport } from "@/types/report";

const KEY = "paidmedia_reports";

export function useReports() {
  const [reports, setReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setReports(JSON.parse(raw));
    } catch {
      setReports([]);
    }
  }, []);

  const save = useCallback((report: SavedReport) => {
    setReports((prev) => {
      const updated = [report, ...prev];
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setReports((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setReports([]);
  }, []);

  return { reports, save, remove, clear };
}
