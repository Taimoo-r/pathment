/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { enrollmentApi, matchingApi } from '@/lib/services/enrollment-api';
import { extractApiErrorMessage } from '@/lib/utils/api-error';
import { toast } from 'sonner';
import { useAuth } from '@/lib/context/AuthContext';

const WORKING_STATUSES = ['active', 'matched'];
const IN_PROGRESS_STATUSES = ['active', 'matched', 'pending_completion', 'level_completed'];

export interface UseMenteeDashboardReturn {
  enrollments: any[];
  loading: boolean;
  completionLoading: string | null;
  // derived subsets
  currentProgramEnrollments: any[];
  pendingEnrollments: any[];
  approvedEnrollments: any[];
  pendingCompletionEnrollments: any[];
  levelCompletedEnrollments: any[];
  completedEnrollments: any[];
  WORKING_STATUSES: string[];
  // actions
  fetchEnrollments: () => Promise<void>;
  handleRequestCompletion: (enrollmentId: string) => Promise<void>;
  handleSubmitRating: (enrollmentId: string, rating: number) => Promise<void>;
  // rating modal state
  ratingTarget: { enrollmentId: string; matchId: string; mentorName: string; programName: string } | null;
  openRatingModal: (enrollmentId: string, programName: string) => Promise<void>;
  closeRatingModal: () => void;
  ratedEnrollmentIds: Set<string>;
}

export function useMenteeDashboard(): UseMenteeDashboardReturn {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completionLoading, setCompletionLoading] = useState<string | null>(null);
  const [ratingTarget, setRatingTarget] = useState<UseMenteeDashboardReturn['ratingTarget']>(null);
  const [ratedEnrollmentIds, setRatedEnrollmentIds] = useState<Set<string>>(new Set());

  const fetchEnrollments = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await enrollmentApi.getAll({ menteeId: user.id });
      const list = response?.data?.enrollments || response?.enrollments || [];
      setEnrollments(list);
    } catch (err: any) {
      console.error('Failed to fetch enrollments:', err);
      toast.error('Failed to load your enrollments');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchEnrollments();
    }
  }, [user?.id, fetchEnrollments]);

  const handleRequestCompletion = useCallback(async (enrollmentId: string) => {
    try {
      setCompletionLoading(enrollmentId);
      await enrollmentApi.requestCompletion(enrollmentId);
      toast.success('Completion request sent to your mentor for approval!');
      fetchEnrollments();
    } catch (err: any) {
      toast.error(extractApiErrorMessage(err, 'Failed to request completion'));
    } finally {
      setCompletionLoading(null);
    }
  }, [fetchEnrollments]);

  // ── Rating ────────────────────────────────────────────────────────────────

  const openRatingModal = useCallback(async (enrollmentId: string, programName: string) => {
    try {
      const response = await matchingApi.getMatches({ enrollmentId });
      const matches: any[] = response?.data?.matches || response?.matches || [];
      const match = matches[0];
      if (!match) {
        toast.error('No match found for this enrollment');
        return;
      }
      if (match.menteeSatisfactionRating != null) {
        toast.info('You have already rated this mentor');
        setRatedEnrollmentIds(prev => new Set(prev).add(enrollmentId));
        return;
      }
      const mentor = match.mentor;
      const mentorName = mentor
        ? `${mentor.firstName ?? ''} ${mentor.lastName ?? ''}`.trim()
        : 'your mentor';
      setRatingTarget({ enrollmentId, matchId: match.id, mentorName, programName });
    } catch (err: any) {
      toast.error(extractApiErrorMessage(err, 'Could not load match details'));
    }
  }, []);

  const closeRatingModal = useCallback(() => setRatingTarget(null), []);

  const handleSubmitRating = useCallback(async (enrollmentId: string, rating: number) => {
    if (!ratingTarget) return;
    await matchingApi.submitRating(ratingTarget.matchId, rating);
    toast.success('Thank you for your feedback!');
    setRatedEnrollmentIds(prev => new Set(prev).add(enrollmentId));
    setRatingTarget(null);
  }, [ratingTarget]);

  return {
    enrollments,
    loading,
    completionLoading,
    currentProgramEnrollments: enrollments.filter(e => IN_PROGRESS_STATUSES.includes(e.status)),
    pendingEnrollments:         enrollments.filter(e => e.status === 'pending_approval'),
    approvedEnrollments:        enrollments.filter(e => e.status === 'approved' || e.status === 'pending_match'),
    pendingCompletionEnrollments: enrollments.filter(e => e.status === 'pending_completion'),
    levelCompletedEnrollments:  enrollments.filter(e => e.status === 'level_completed'),
    completedEnrollments:       enrollments.filter(e => e.status === 'program_completed'),
    WORKING_STATUSES,
    fetchEnrollments,
    handleRequestCompletion,
    handleSubmitRating,
    ratingTarget,
    openRatingModal,
    closeRatingModal,
    ratedEnrollmentIds,
  };
}
