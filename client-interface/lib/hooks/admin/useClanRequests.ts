import { useCallback, useEffect, useState } from 'react';
import { clanRequestsApi } from '@/lib/services/clan-requests-api';

export interface ChangeRequest {
  id: string;
  mentee: string | null;
  fromClan: string | null;
  toClan: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'denied';
  resolutionNote: string | null;
  at: string;
}
export interface CrossClanItem {
  id: string;
  kind: string;
  user: string | null;
  fromClan: string | null;
  toClan: string | null;
  note: string | null;
  status?: string;
  at: string;
}
export interface UseClanRequestsReturn {
  requests: ChangeRequest[];
  crossClan: CrossClanItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useClanRequests(): UseClanRequestsReturn {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [crossClan, setCrossClan] = useState<CrossClanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await clanRequestsApi.overview();
      setRequests(res?.data?.requests ?? []);
      setCrossClan(res?.data?.crossClan ?? []);
    } catch {
      setError('Failed to load clan requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { requests, crossClan, loading, error, refetch: fetchAll };
}
