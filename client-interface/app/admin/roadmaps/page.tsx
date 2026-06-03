'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Route, Plus, Trash2, X, Loader2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useOrgRoadmaps } from '@/lib/hooks/admin/useOrgRoadmaps';
import { programManagementApi } from '@/lib/services/program-api';
import type { RoadmapStepInput } from '@/lib/services/roadmap-api';

const TYPES = ['assignment', 'project', 'quiz', 'reading', 'video', 'discussion'];

interface ProgramOpt { id: string; name: string }

export default function AdminRoadmapsPage() {
  const { roadmaps, loading, create, setPublished, remove } = useOrgRoadmaps();
  const [programs, setPrograms] = useState<ProgramOpt[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    programManagementApi.programs.getAll().then((res: any) => {
      const list = res?.data?.programs ?? res?.programs ?? res?.data ?? [];
      setPrograms((Array.isArray(list) ? list : []).map((p: any) => ({ id: p.id, name: p.name })));
    }).catch(() => setPrograms([]));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-slate-900 mb-1 flex items-center gap-2"><Route className="w-5 h-5 text-indigo-600" /> Org Roadmaps</h1>
          <p className="text-slate-600 text-sm">Author the shared roadmap library. Mentors import published roadmaps and assign them to mentees.</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 shrink-0">
          <Plus className="w-4 h-4" /> New roadmap
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : roadmaps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Route className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-1">No org roadmaps yet</p>
          <p className="text-slate-500 text-sm">Create one to seed the shared library mentors can import.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roadmaps.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-slate-900 font-semibold truncate">{r.name}</h3>
                  {r.description && <p className="text-slate-500 text-sm mt-0.5 line-clamp-2">{r.description}</p>}
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${r.published ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {r.published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="tabular-nums">{r.steps.length} step{r.steps.length === 1 ? '' : 's'}</span>
                {r.skillTags?.slice(0, 3).map((t) => <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">{t}</span>)}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={async () => { setBusy(r.id); try { await setPublished(r.id, !r.published); } catch { toast.error('Could not update'); } finally { setBusy(null); } }}
                  disabled={busy === r.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  {r.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {r.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={async () => { if (!confirm(`Delete "${r.name}"? Imported mentor copies are unaffected.`)) return; setBusy(r.id); try { await remove(r.id); toast.success('Deleted'); } catch { toast.error('Could not delete'); } finally { setBusy(null); } }}
                  disabled={busy === r.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:border-red-200 disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateDrawer programs={programs} onClose={() => setCreating(false)} onCreate={create} />
      )}
    </div>
  );
}

function CreateDrawer({ programs, onClose, onCreate }: {
  programs: ProgramOpt[];
  onClose: () => void;
  onCreate: (data: { name: string; programId: string; description?: string; skillTags?: string[]; steps: RoadmapStepInput[]; published?: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [programId, setProgramId] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [published, setPublishedFlag] = useState(true);
  const [steps, setSteps] = useState<RoadmapStepInput[]>([{ title: '', type: 'assignment' }]);
  const [saving, setSaving] = useState(false);

  const field = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  const submit = async () => {
    const clean = steps.map((s) => ({ ...s, title: s.title.trim() })).filter((s) => s.title);
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!programId) { toast.error('Pick a program'); return; }
    if (clean.length === 0) { toast.error('Add at least one step'); return; }
    try {
      setSaving(true);
      await onCreate({
        name: name.trim(),
        programId,
        description: description.trim() || undefined,
        skillTags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        steps: clean,
        published,
      });
      toast.success('Roadmap created');
      onClose();
    } catch { toast.error('Could not create roadmap'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="New org roadmap" className="relative w-full max-w-lg h-full bg-white shadow-xl flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">New org roadmap</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Frontend Foundations" className={field} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Program <span className="text-red-500">*</span></label>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} className={field}>
              <option value="">Select a program…</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${field} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Skill tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="react, css, testing" className={field} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Steps</span>
              <button onClick={() => setSteps((s) => [...s, { title: '', type: 'assignment' }])}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"><Plus className="w-3 h-3" /> Add step</button>
            </div>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2">
                  <GripVertical className="w-4 h-4 text-slate-300 mt-2 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <input value={s.title} onChange={(e) => setSteps((prev) => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                      placeholder={`Step ${i + 1} title`} className={field} />
                    <div className="flex gap-2">
                      <select value={s.type} onChange={(e) => setSteps((prev) => prev.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
                        className={`${field} capitalize`}>
                        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input type="number" min={0} placeholder="Due +days"
                        onChange={(e) => setSteps((prev) => prev.map((x, j) => j === i ? { ...x, dueOffsetDays: Number(e.target.value) || undefined } : x))}
                        className={`${field} w-32`} />
                    </div>
                  </div>
                  {steps.length > 1 && (
                    <button onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove step"
                      className="p-1.5 text-slate-400 hover:text-red-600 mt-0.5"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={published} onChange={(e) => setPublishedFlag(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            Publish immediately (mentors can import it)
          </label>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm inline-flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create roadmap
          </button>
        </div>
      </div>
    </div>
  );
}
