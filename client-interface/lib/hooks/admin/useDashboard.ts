'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/services/admin-api';
import { toast } from 'sonner';

interface DashboardStats {
  totalPrograms: number;
  activeMentees: number;
  activeMentors: number;
  completionRate: number;
}

interface RecentProgram {
  id: string;
  name: string;
  status: string;
  enrollments: number;
  completion: number;
  startDate: string;
  mentors?: number;
}

interface PendingMatch {
  id: string;
  mentee: { id: string; name: string; email: string };
  program: string;
  enrolledAt: string;
  waitTime: string;
}

interface DashboardData {
  stats?: DashboardStats;
  recentPrograms?: RecentProgram[];
  pendingMatches?: PendingMatch[];
}

interface UseDashboardReturn {
  dashboardData: DashboardData | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.dashboard.getStats();
      setDashboardData(response as DashboardData);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Failed to fetch dashboard data:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { dashboardData, loading, refetch: fetchDashboardData };
}
