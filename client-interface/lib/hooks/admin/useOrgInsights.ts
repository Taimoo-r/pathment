import { useCallback, useEffect, useState } from 'react';
import { clanApi } from '@/lib/services/clan-api';

export type InsightStatus = 'red' | 'amber' | 'green';

export interface InsightClan {
  id: string;
  name: string;
  program: string;
  status: InsightStatus;
  statusLabel: string;
  memberCount: number;
  avgCompletion: number;
  avgOnTime: number;
  avgRelative: number;
  atRisk: number;
  openBlockers: number;
  extensions: number;
}

export interface InsightDistributionRow {
  id: string;
  name: string;
  absolute: number;
  relative: number;
  gap: number;
}

export interface OrgInsights {
  kpis: {
    activeMentees: number;
    avgCompletion: number;
    avgRelative: number;
    atRisk: number;
    totalExtensions: number;
    totalOpenBlockers: number;
    clansRed: number;
    clans: number;
  };
  fairness: { avgAbsolute: number; avgRelative: number; gap: number };
  clans: InsightClan[];
  distribution: InsightDistributionRow[];
  redClans: string[];
}

export interface UseOrgInsightsReturn {
  insights: OrgInsights | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOrgInsights(): UseOrgInsightsReturn {
  const [insights, setInsights] = useState<OrgInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await clanApi.insights();
      setInsights(res?.data ?? res ?? null);
    } catch {
      setError('Failed to load insights');
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  return { insights, loading, error, refetch: fetchInsights };
}
