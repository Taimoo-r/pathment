'use client';

import { useCallback, useEffect, useState } from 'react';
import { menteeRoadmapApi, type MenteeRoadmap } from '@/lib/services/roadmap-api';

export interface UseMyRoadmapsReturn {
  roadmaps: MenteeRoadmap[];
  loading: boolean;
  refetch: () => Promise<void>;
}

/** The logged-in mentee's roadmap progress (step X/N). */
export function useMyRoadmaps(): UseMyRoadmapsReturn {
  const [roadmaps, setRoadmaps] = useState<MenteeRoadmap[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoadmaps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await menteeRoadmapApi.mine();
      setRoadmaps(res?.data?.roadmaps ?? []);
    } catch {
      setRoadmaps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoadmaps(); }, [fetchRoadmaps]);

  return { roadmaps, loading, refetch: fetchRoadmaps };
}
