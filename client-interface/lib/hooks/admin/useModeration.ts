import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { communityApi } from '@/lib/services/community-api';

export type ReportStatus = 'open' | 'reviewed' | 'dismissed';

export interface CommunityReportRow {
  id: string;
  targetType: 'post' | 'comment';
  targetId: string;
  reason: string | null;
  status: ReportStatus;
  at: string;
  reporter: { id: string; name: string };
  preview: string;
  targetAuthor: string | null;
  targetDeleted: boolean;
}

export function useModeration() {
  const [reports, setReports] = useState<CommunityReportRow[]>([]);
  const [status, setStatus] = useState<ReportStatus>('open');
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const r: any = await communityApi.reports(status);
      setReports(r?.data?.reports ?? []);
    } catch {
      toast.error('Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const resolve = useCallback(async (id: string, s: 'reviewed' | 'dismissed') => {
    try { await communityApi.resolveReport(id, s); toast.success(s === 'dismissed' ? 'Dismissed' : 'Marked reviewed'); await fetchReports(); }
    catch { toast.error('Could not update report'); }
  }, [fetchReports]);

  const removeContent = useCallback(async (row: CommunityReportRow) => {
    try {
      if (row.targetType === 'post') await communityApi.deletePost(row.targetId);
      else await communityApi.deleteComment(row.targetId);
      await communityApi.resolveReport(row.id, 'reviewed');
      toast.success('Content removed');
      await fetchReports();
    } catch { toast.error('Could not remove content'); }
  }, [fetchReports]);

  return { reports, status, setStatus, loading, refetch: fetchReports, resolve, removeContent };
}
