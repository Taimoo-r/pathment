'use client';

import { useCallback, useEffect, useState } from 'react';
import { Crown, Loader2, Search, Shield, Trash2, UserPlus, Users2, X } from 'lucide-react';
import { toast } from 'sonner';

import { apiClient } from '@/lib/services/api-client';
import { clanApi } from '@/lib/services/clan-api';
import { extractApiErrorMessage } from '@/lib/utils/api-error';
import { Drawer } from '@/components/shared/Drawer';

interface Member {
  role: 'lead_mentor' | 'co_mentor' | 'core_team' | 'mentee';
  user: { id: string; firstName: string; lastName: string; email: string; role: string };
}
interface ClanDetail {
  id: string;
  name: string;
  program?: { id: string; name: string };
  memberships: Member[];
}
interface MyMembership {
  role: string;
  clan: { id: string; name: string; programId: string; status: string };
}

const name = (u: { firstName: string; lastName: string; email: string }) => `${u.firstName} ${u.lastName}`.trim() || u.email;
const initials = (u: { firstName: string; lastName: string; email: string }) =>
  (`${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.trim() || u.email[0] || '?').toUpperCase();

export default function ClanTeamPage() {
  const [memberships, setMemberships] = useState<MyMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clanApi.myMemberships()
      .then((r: any) => {
        const mine: MyMembership[] = (r.data?.memberships || [])
          .filter((m: any) => ['lead_mentor', 'co_mentor'].includes(m.role));
        setMemberships(mine);
      })
      .catch(() => toast.error('Could not load your clans'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-slate-900 mb-2 inline-flex items-center gap-2"><Users2 className="w-6 h-6 text-brand-600" /> Clan Team</h1>
        <p className="text-slate-600">Manage the people who help run your clan — add co-mentors and core-team members. Mentees are placed by admins.</p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : memberships.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-card p-12 text-center text-slate-400">
          You&apos;re not part of any clan as a mentor yet.
        </div>
      ) : (
        <div className="space-y-5">
          {memberships.map((m) => (
            <ClanTeamCard key={m.clan.id} clanId={m.clan.id} myRole={m.role} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClanTeamCard({ clanId, myRole }: { clanId: string; myRole: string }) {
  const [clan, setClan] = useState<ClanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const canManage = myRole === 'lead_mentor';

  const load = useCallback(() => {
    setLoading(true);
    clanApi.get(clanId)
      .then((r: any) => setClan(r.data?.clan || r.data))
      .catch(() => toast.error('Could not load clan'))
      .finally(() => setLoading(false));
  }, [clanId]);
  useEffect(load, [load]);

  const remove = async (userId: string, label: string) => {
    if (!confirm(`Remove ${label} from the team?`)) return;
    try { await clanApi.removeMember(clanId, userId); toast.success('Removed'); load(); }
    catch (e) { toast.error(extractApiErrorMessage(e, 'Could not remove')); }
  };

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-card p-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>;
  }
  if (!clan) return null;

  const members = clan.memberships || [];
  const lead = members.filter((m) => m.role === 'lead_mentor');
  const co = members.filter((m) => m.role === 'co_mentor');
  const core = members.filter((m) => m.role === 'core_team');
  const menteeCount = members.filter((m) => m.role === 'mentee').length;

  const Person = ({ m, removable }: { m: Member; removable: boolean }) => (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 text-sm font-medium flex items-center justify-center shrink-0">{initials(m.user)}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{name(m.user)}</p>
          <p className="text-xs text-slate-500 truncate">{m.user.email}</p>
        </div>
      </div>
      {removable && canManage && (
        <button onClick={() => remove(m.user.id, name(m.user))} className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 shrink-0" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
      )}
    </div>
  );

  const Section = ({ icon, title, items, removable }: { icon: React.ReactNode; title: string; items: Member[]; removable: boolean }) => (
    items.length === 0 ? null : (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2 inline-flex items-center gap-1.5">{icon} {title}</p>
        <div className="grid sm:grid-cols-2 gap-2">{items.map((m) => <Person key={m.user.id} m={m} removable={removable} />)}</div>
      </div>
    )
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">{clan.name}</h2>
          <p className="text-sm text-slate-500">{clan.program?.name} · {menteeCount} mentee{menteeCount === 1 ? '' : 's'}</p>
        </div>
        {canManage ? (
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 shrink-0">
            <UserPlus className="w-4 h-4" /> Add to team
          </button>
        ) : (
          <span className="text-xs text-slate-400 shrink-0">View only (co-mentor)</span>
        )}
      </div>

      <div className="mt-5 space-y-5">
        <Section icon={<Crown className="w-3.5 h-3.5" />} title="Lead mentor" items={lead} removable={false} />
        <Section icon={<Shield className="w-3.5 h-3.5" />} title="Co-mentors" items={co} removable />
        <Section icon={<Users2 className="w-3.5 h-3.5" />} title="Core team" items={core} removable />
        {co.length === 0 && core.length === 0 && (
          <p className="text-sm text-slate-400">No co-mentors or core-team members yet.</p>
        )}
      </div>

      {adding && <AddTeamMemberDrawer clanId={clanId} onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load(); }} />}
    </div>
  );
}

function AddTeamMemberDrawer({ clanId, onClose, onAdded }: { clanId: string; onClose: () => void; onAdded: () => void }) {
  const [role, setRole] = useState<'co_mentor' | 'core_team'>('co_mentor');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; firstName: string; lastName: string; email: string; role: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      setSearching(true);
      apiClient.get<any>('/messaging/users/search', { params: { q } })
        .then((r) => setResults(r.data?.users || []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const add = async () => {
    if (!picked) { toast.error('Pick a person'); return; }
    setSaving(true);
    try {
      await clanApi.addMember(clanId, picked.id, role);
      toast.success(`Added ${name(picked)} as ${role === 'co_mentor' ? 'co-mentor' : 'core team'}`);
      onAdded();
    } catch (e) { toast.error(extractApiErrorMessage(e, 'Could not add to team')); }
    finally { setSaving(false); }
  };

  return (
    <Drawer open onClose={onClose} title="Add to team" subtitle="Co-mentors help you run the clan"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm">Cancel</button>
          <button onClick={add} disabled={saving || !picked} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <div className="grid grid-cols-2 gap-2">
            {(['co_mentor', 'core_team'] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`rounded-lg border px-3 py-2 text-sm ${role === r ? 'border-brand-400 bg-brand-50 dark:bg-brand-500/15 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {r === 'co_mentor' ? 'Co-mentor' : 'Core team'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Person</label>
          {picked ? (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">{name(picked)}</p>
                <p className="text-xs text-slate-500">{picked.email}</p>
              </div>
              <button onClick={() => setPicked(null)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…" className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="mt-2 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {searching ? (
                  <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand-600" /></div>
                ) : results.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">{query.trim().length < 2 ? 'Type to search.' : 'No matches.'}</p>
                ) : results.map((u) => (
                  <button key={u.id} onClick={() => { setPicked(u); setResults([]); setQuery(''); }} className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50">
                    <p className="text-sm font-medium text-slate-900">{name(u)}</p>
                    <p className="text-xs text-slate-500">{u.email} · {u.role}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}
