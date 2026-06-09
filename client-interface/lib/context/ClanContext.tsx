'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { clanApi } from '@/lib/services/clan-api';

// Clan roles that mean "I mentor this clan" (so it belongs in the scope picker).
const MENTOR_CLAN_ROLES = ['lead_mentor', 'co_mentor', 'core_team'];
const STORAGE_KEY = 'pathment-active-clan';
export const ALL_CLANS = 'all';

export interface ClanLite { id: string; name: string; }

interface ClanContextValue {
  /** Clans the current user mentors (drives the scope selector). */
  clans: ClanLite[];
  /** 'all' (merged view) or a specific clan id. */
  activeClanId: string;
  setActiveClanId: (id: string) => void;
  loading: boolean;
}

const ClanContext = createContext<ClanContextValue | undefined>(undefined);

export function ClanProvider({ children }: { children: ReactNode }) {
  const { user, availableRoles } = useAuth();
  const [clans, setClans] = useState<ClanLite[]>([]);
  const [activeClanId, setActiveClanIdState] = useState<string>(ALL_CLANS);
  const [loading, setLoading] = useState(false);

  const isMentor = !!availableRoles?.includes('mentor');

  // Load the clans this user mentors (membership-based; covers lead/co/core).
  useEffect(() => {
    if (!user || !isMentor) { setClans([]); return; }
    let cancelled = false;
    setLoading(true);
    clanApi.myMemberships()
      .then((r: any) => {
        if (cancelled) return;
        const memberships = r?.data?.memberships ?? r?.memberships ?? [];
        const seen = new Set<string>();
        const list: ClanLite[] = [];
        for (const m of memberships) {
          if (!MENTOR_CLAN_ROLES.includes(m.role)) continue;
          const c = m.clan;
          if (!c || seen.has(c.id)) continue;
          seen.add(c.id);
          list.push({ id: c.id, name: c.name });
        }
        setClans(list);
      })
      .catch(() => { if (!cancelled) setClans([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, isMentor]);

  // Restore the saved choice once clans are known; drop it if it's stale.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || saved === ALL_CLANS) { setActiveClanIdState(ALL_CLANS); return; }
    setActiveClanIdState(clans.some((c) => c.id === saved) ? saved : ALL_CLANS);
  }, [clans]);

  const setActiveClanId = useCallback((id: string) => {
    setActiveClanIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <ClanContext.Provider value={{ clans, activeClanId, setActiveClanId, loading }}>
      {children}
    </ClanContext.Provider>
  );
}

/** Safe even outside the provider (returns an inert "all clans" context). */
export function useClan(): ClanContextValue {
  const ctx = useContext(ClanContext);
  if (!ctx) return { clans: [], activeClanId: ALL_CLANS, setActiveClanId: () => {}, loading: false };
  return ctx;
}
