'use client';

import { useCallback, useEffect, useState } from 'react';
import { mentorSpecApi, type MentorSpec } from '@/lib/services/mentor-spec-api';

const EMPTY: MentorSpec = { intro: '', principles: [], responsibilities: [], conduct: [], time: [], faqs: [] };

export function useMentorSpec() {
  const [spec, setSpec] = useState<MentorSpec | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSpec = useCallback(async () => {
    try {
      setLoading(true);
      const res = await mentorSpecApi.get();
      setSpec(res?.data?.spec ?? EMPTY);
    } catch {
      setSpec(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (next: MentorSpec) => {
    const res = await mentorSpecApi.save(next);
    setSpec(res?.data?.spec ?? next);
  }, []);

  useEffect(() => { fetchSpec(); }, [fetchSpec]);

  return { spec, loading, refetch: fetchSpec, save };
}
