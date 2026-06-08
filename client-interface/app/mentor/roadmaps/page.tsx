'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Route, Plus, X, Trash2, Download, Users, Loader2, GripVertical, Tag, Sparkles, GitBranch, Check, Pencil,
  ArrowUp, ArrowDown, CornerDownRight, ChevronDown,
} from 'lucide-react';
import { useMentorRoadmaps, useMentorPrograms, useMentorCohort, type LinearRoadmap } from '@/lib/hooks/mentor';
import { mentorApi } from '@/lib/services/mentor-api';
import { roadmapAiApi } from '@/lib/services/roadmap-api';
import { extractApiErrorMessage } from '@/lib/utils/api-error';
import { Drawer } from '@/components/shared/Drawer';
import RichTextEditor from '@/components/shared/RichTextEditor';

const STEP_TYPES = ['project', 'assignment', 'reading', 'video', 'quiz', 'discussion'];
const EFFORTS = ['xs', 's', 'm', 'l'];
const TITLE_MAX = 255;

// Deadline quick-picks for assignment. `null` days = "Default" (use each step's
// own timing). Shared shape with the custom-task drawer for consistency.
const DUE_PRESETS: { label: string; days: number | null }[] = [
  { label: 'Default', days: null }, { label: '+3 days', days: 3 }, { label: '+1 week', days: 7 }, { label: '+2 weeks', days: 14 },
];
const presetDate = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]; };

// A stable per-step key so React (and especially the stateful TipTap editor) keeps
// each step's identity across drag-reorders — mutating by key, never by index.
const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

interface DraftStep { key: string; id?: string; title: string; type: string; description: string; criteria: string; effort: string; dueOffsetDays: string }

const emptyStep = (): DraftStep => ({ key: uid(), title: '', type: 'project', description: '', criteria: '', effort: 'm', dueOffsetDays: '' });

// ── Create / edit drawer ─────────────────────────────────────────────────────
function CreateDrawer({ roadmap, onClose, onCreated }: { roadmap?: LinearRoadmap | null; onClose: () => void; onCreated: () => void }) {
  const editing = !!roadmap;
  const { programs, loading: progLoading } = useMentorPrograms();

  // Drafts survive an API error or an accidental refresh: we persist every change
  // to localStorage and restore it next open, so work is never lost on a failed save.
  const draftKey = `pathment:roadmap-draft:${roadmap?.id || 'new'}`;
  const loadDraft = (): Record<string, unknown> | null => {
    if (typeof window === 'undefined') return null;
    try { const r = window.localStorage.getItem(draftKey); return r ? JSON.parse(r) : null; } catch { return null; }
  };
  const draft = loadDraft();

  const [name, setName] = useState<string>((draft?.name as string) ?? roadmap?.name ?? '');
  const [programId, setProgramId] = useState<string>((draft?.programId as string) ?? roadmap?.programId ?? '');
  const [tags, setTags] = useState<string>((draft?.tags as string) ?? (roadmap?.skillTags || []).join(', '));
  const [steps, setSteps] = useState<DraftStep[]>(() => {
    if (Array.isArray(draft?.steps) && (draft!.steps as DraftStep[]).length) {
      // Backfill keys for drafts saved before this field existed.
      return (draft!.steps as DraftStep[]).map((s) => ({ ...s, key: s.key || uid() }));
    }
    if (editing && roadmap!.steps.length) {
      return roadmap!.steps.map((s) => ({
        key: s.id, id: s.id, title: s.title, type: s.type || 'project',
        description: s.description || '',
        effort: s.effort || 'm', dueOffsetDays: s.dueOffsetDays != null ? String(s.dueOffsetDays) : '',
        criteria: (s.acceptanceCriteria || []).join('\n'),
      }));
    }
    return [emptyStep()];
  });
  const [restored] = useState<boolean>(!!draft);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [openDetails, setOpenDetails] = useState<Set<string>>(new Set());

  // AI generation options
  const [genOpen, setGenOpen] = useState(false);
  const [genMode, setGenMode] = useState<'tasks' | 'weeks'>('tasks');
  const [genCount, setGenCount] = useState('8');
  const [genWeeks, setGenWeeks] = useState('6');
  const [genInstructions, setGenInstructions] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(draftKey, JSON.stringify({ name, programId, tags, steps })); } catch { /* quota */ }
  }, [name, programId, tags, steps, draftKey]);
  const clearDraft = () => { try { if (typeof window !== 'undefined') window.localStorage.removeItem(draftKey); } catch { /* noop */ } };

  // All per-step mutations go through the stable key (see `uid` note above).
  const setStep = (key: string, patch: Partial<DraftStep>) =>
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const addStep = () => setSteps((prev) => [...prev, emptyStep()]);
  const insertAfter = (key: string) => setSteps((prev) => {
    const i = prev.findIndex((s) => s.key === key);
    const n = [...prev]; n.splice(i + 1, 0, emptyStep()); return n;
  });
  const removeStep = (key: string) => setSteps((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev));
  const move = (key: string, dir: -1 | 1) => setSteps((prev) => {
    const i = prev.findIndex((s) => s.key === key);
    const to = i + dir;
    if (i < 0 || to < 0 || to >= prev.length) return prev;
    const n = [...prev]; const [m] = n.splice(i, 1); n.splice(to, 0, m); return n;
  });
  const toggleDetails = (key: string) => setOpenDetails((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  // Native drag-and-drop reordering (no extra dependency).
  const [dragKey, setDragKey] = useState<string | null>(null);
  const dropOn = (targetKey: string) => {
    setSteps((prev) => {
      if (!dragKey || dragKey === targetKey) return prev;
      const from = prev.findIndex((s) => s.key === dragKey);
      const to = prev.findIndex((s) => s.key === targetKey);
      if (from < 0 || to < 0) return prev;
      const n = [...prev]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n;
    });
    setDragKey(null);
  };

  const tooLong = steps.some((s) => s.title.trim().length > TITLE_MAX);

  const generate = async () => {
    if (!name.trim()) { toast.error('Add a name first'); return; }
    try {
      setGenerating(true);
      const res = await roadmapAiApi.generate({
        name: name.trim(),
        skillTags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        mode: genMode,
        count: Number(genCount) || undefined,
        durationWeeks: genMode === 'weeks' ? (Number(genWeeks) || undefined) : undefined,
        additionalInstructions: genInstructions.trim() || undefined,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aiSteps: DraftStep[] = ((res as any)?.data?.steps || []).map((s: any) => ({
        key: uid(),
        title: String(s.title || '').slice(0, TITLE_MAX),
        type: s.type || 'project',
        description: s.description || '',
        effort: s.effort || 'm',
        dueOffsetDays: s.dueOffsetDays != null ? String(s.dueOffsetDays) : '',
        criteria: Array.isArray(s.criteria) ? s.criteria.join('\n') : (s.criteria || ''),
      }));
      if (aiSteps.length === 0) { toast.error('AI returned no steps — try richer instructions'); return; }
      setSteps(aiSteps);
      setGenOpen(false);
      toast.success(`Drafted ${aiSteps.length} step${aiSteps.length === 1 ? '' : 's'} — review & tweak`);
    } catch (e) {
      toast.error(extractApiErrorMessage(e, 'Could not generate. Set a Roadmap model in Settings → AI Connections.'));
    } finally { setGenerating(false); }
  };

  const save = async () => {
    const cleanSteps = steps.filter((s) => s.title.trim());
    if (!name.trim() || !programId || cleanSteps.length === 0) {
      toast.error('Add a name, a program, and at least one step');
      return;
    }
    if (tooLong) { toast.error('A step title is too long — shorten it and move the detail into the step description.'); return; }
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const stepPayload = cleanSteps.map((s) => ({
      id: s.id, // present → updated in place; absent → created
      title: s.title.trim(),
      type: s.type,
      description: s.description,
      effort: s.effort,
      dueOffsetDays: s.dueOffsetDays.trim() ? Number(s.dueOffsetDays) : undefined,
      criteria: s.criteria.split('\n').map((c) => c.trim()).filter(Boolean),
    }));
    try {
      setSaving(true);
      if (editing) {
        await mentorApi.updateRoadmapMeta(roadmap!.id, { name: name.trim(), skillTags: tagList });
        await mentorApi.replaceRoadmapSteps(roadmap!.id, stepPayload);
        toast.success('Roadmap saved');
      } else {
        await mentorApi.createRoadmap({ name: name.trim(), programId, skillTags: tagList, steps: stepPayload });
        toast.success('Roadmap created');
      }
      clearDraft();
      onCreated();
      onClose();
    } catch (e) {
      // Draft is intentionally NOT cleared here — the work stays saved locally so a
      // failed save can be retried without re-typing anything.
      toast.error(extractApiErrorMessage(e, editing ? 'Could not save the roadmap' : 'Could not create the roadmap'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full bg-card border-l border-slate-200 dark:border-slate-700 shadow-2xl dark:shadow-[-8px_0_30px_rgba(0,0,0,0.6)] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{editing ? 'Edit roadmap' : 'New roadmap'}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {restored && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Restored your unsaved draft. <button onClick={() => { clearDraft(); window.location.reload(); }} className="underline font-medium">Discard</button>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Backend Foundations"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Program <span className="text-red-500">*</span></label>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} disabled={editing}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-card disabled:opacity-60">
              <option value="">{progLoading ? 'Loading…' : 'Select a program'}</option>
              {programs.map((p: { id: string; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {editing && <p className="text-xs text-slate-400 mt-1">A roadmap stays in its program.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Skill tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="node, express, sql"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {/* AI generation */}
          <div className="rounded-xl border border-brand-200 dark:border-brand-500/30 bg-brand-50/50 dark:bg-brand-500/10">
            <button type="button" onClick={() => setGenOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium text-brand-700">
              <span className="inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4" />Generate steps with AI</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${genOpen ? 'rotate-180' : ''}`} />
            </button>
            {genOpen && (
              <div className="px-3.5 pb-3.5 space-y-3 border-t border-brand-200 dark:border-brand-500/30 pt-3">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setGenMode('tasks')}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${genMode === 'tasks' ? 'border-brand-400 bg-brand-100 text-brand-800' : 'border-slate-200 text-slate-600'}`}>
                    Flat task list
                  </button>
                  <button type="button" onClick={() => setGenMode('weeks')}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${genMode === 'weeks' ? 'border-brand-400 bg-brand-100 text-brand-800' : 'border-slate-200 text-slate-600'}`}>
                    Paced by weeks
                  </button>
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 text-xs text-slate-500">
                    Steps
                    <input type="number" min={1} max={40} value={genCount} onChange={(e) => setGenCount(e.target.value)}
                      className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
                  </label>
                  {genMode === 'weeks' && (
                    <label className="flex-1 text-xs text-slate-500">
                      Weeks
                      <input type="number" min={1} max={52} value={genWeeks} onChange={(e) => setGenWeeks(e.target.value)}
                        className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
                    </label>
                  )}
                </div>
                <textarea value={genInstructions} onChange={(e) => setGenInstructions(e.target.value)} rows={3}
                  placeholder="What to include, prerequisites, specific topics or resources, tone… (optional)"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <button type="button" onClick={generate} disabled={generating}
                  className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 inline-flex items-center justify-center gap-2 disabled:opacity-50">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? 'Generating…' : 'Generate'}
                </button>
                <p className="text-[11px] text-slate-400">Generating replaces the steps below. Review &amp; tweak before saving.</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <label className="text-sm font-medium text-slate-700">Steps (in order) <span className="text-red-500">*</span></label>
              <button onClick={addStep} className="text-brand-600 hover:text-brand-700 text-sm inline-flex items-center gap-1"><Plus className="w-4 h-4" />Add step</button>
            </div>
            <div className="space-y-3">
              {steps.map((s, i) => {
                const over = s.title.trim().length > TITLE_MAX;
                const detailsOpen = openDetails.has(s.key) || !!s.description;
                return (
                  <div key={s.key}
                    onDragOver={(e) => { if (dragKey) e.preventDefault(); }}
                    onDrop={() => dropOn(s.key)}
                    className={`rounded-xl border p-3 ${dragKey === s.key ? 'border-brand-400 opacity-60' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span draggable onDragStart={() => setDragKey(s.key)} onDragEnd={() => setDragKey(null)}
                        title="Drag to reorder" className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-medium text-slate-400">Step {i + 1}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <button onClick={() => move(s.key, -1)} disabled={i === 0} title="Move up"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => move(s.key, 1)} disabled={i === steps.length - 1} title="Move down"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                        {steps.length > 1 && (
                          <button onClick={() => removeStep(s.key)} title="Remove step" className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </div>
                    <input value={s.title} maxLength={TITLE_MAX + 50} onChange={(e) => setStep(s.key, { title: e.target.value })}
                      placeholder="Step title (keep it short)"
                      className={`w-full border rounded-lg px-3 py-1.5 text-sm mb-1 focus:outline-none focus:ring-2 ${over ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:ring-brand-500'}`} />
                    {over && <p className="text-[11px] text-red-500 mb-1">Title is too long ({s.title.trim().length}/{TITLE_MAX}). Move the detail into the description below.</p>}
                    <div className="flex flex-wrap gap-2">
                      <select value={s.type} onChange={(e) => setStep(s.key, { type: e.target.value })}
                        className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-card capitalize focus:outline-none focus:ring-2 focus:ring-brand-500">
                        {STEP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select value={s.effort} onChange={(e) => setStep(s.key, { effort: e.target.value })} title="Effort"
                        className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-card uppercase focus:outline-none focus:ring-2 focus:ring-brand-500">
                        {EFFORTS.map((ef) => <option key={ef} value={ef}>{ef}</option>)}
                      </select>
                      <input type="number" min={1} value={s.dueOffsetDays} onChange={(e) => setStep(s.key, { dueOffsetDays: e.target.value })}
                        placeholder="due +days"
                        className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>

                    {/* Rich detail — instructions, resources, links. Keyed by stable s.key
                        and mutated by key so reordering never crosses wires. */}
                    {detailsOpen ? (
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Step details</label>
                        <RichTextEditor content={s.description} onChange={(html) => setStep(s.key, { description: html })}
                          placeholder="Instructions, resources, links the mentee needs for this step…" minHeight="120px" />
                      </div>
                    ) : (
                      <button type="button" onClick={() => toggleDetails(s.key)}
                        className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add details &amp; resources
                      </button>
                    )}

                    <textarea value={s.criteria} onChange={(e) => setStep(s.key, { criteria: e.target.value })} rows={2}
                      placeholder="Acceptance criteria, one per line"
                      className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" />

                    <button type="button" onClick={() => insertAfter(s.key)}
                      className="mt-2 text-[11px] font-medium text-slate-400 hover:text-brand-600 inline-flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3" /> Insert step below
                    </button>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={addStep}
              className="mt-3 w-full rounded-lg border border-dashed border-slate-300 dark:border-slate-700 py-2 text-xs font-medium text-slate-500 hover:border-brand-300 hover:text-brand-700 inline-flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add step
            </button>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving || tooLong} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm inline-flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{editing ? 'Save roadmap' : 'Create roadmap'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assign drawer ─────────────────────────────────────────────────────────────
function AssignDrawer({ roadmap, onClose, onAssigned }: { roadmap: LinearRoadmap; onClose: () => void; onAssigned: () => void }) {
  const { cohort, loading } = useMentorCohort();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [startStep, setStartStep] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const assign = async () => {
    if (selected.size === 0) { toast.error('Pick at least one mentee'); return; }
    try {
      setSaving(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await mentorApi.assignRoadmap(roadmap.id, { menteeIds: [...selected], startStep, dueDate: dueDate || undefined });
      const assigned = res?.data?.assigned ?? selected.size;
      const failed = res?.data?.failed ?? 0;
      if (assigned === 0) {
        const reason = res?.data?.results?.find((r: { ok: boolean; error?: string }) => !r.ok)?.error;
        toast.error(reason || 'Could not assign the roadmap');
        setSaving(false);
        return;
      }
      toast.success(`Assigned "${roadmap.name}" to ${assigned} mentee${assigned > 1 ? 's' : ''}${failed ? ` (${failed} failed)` : ''}`);
      onAssigned();
      onClose();
    } catch {
      toast.error('Could not assign the roadmap');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card border-l border-slate-200 dark:border-slate-700 shadow-2xl dark:shadow-[-8px_0_30px_rgba(0,0,0,0.6)] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Assign roadmap</h2>
            <p className="text-sm text-slate-500 mt-0.5">{roadmap.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start at step</label>
            <select value={startStep} onChange={(e) => setStartStep(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-brand-500">
              {roadmap.steps.map((s, i) => <option key={s.id} value={i}>{i + 1}. {s.title}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">Skip steps they already know.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {DUE_PRESETS.map((p) => {
                const val = p.days == null ? '' : presetDate(p.days);
                const active = dueDate === val;
                return (
                  <button key={p.label} type="button" onClick={() => setDueDate(val)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${active ? 'border-brand-400 bg-brand-100 text-brand-800' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                    {p.label}
                  </button>
                );
              })}
            </div>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <p className="text-xs text-slate-400 mt-1">Pick a preset or an exact date. &ldquo;Default&rdquo; uses each step&apos;s own timing (+7 days).</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mentees</label>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : cohort.length === 0 ? (
              <p className="text-sm text-slate-500">No mentees in your cohort yet.</p>
            ) : (
              <div className="space-y-1">
                {cohort.map((m) => (
                  <label key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    <span className="text-sm text-slate-700">{m.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={assign} disabled={saving} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm inline-flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Assign{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chain drawer: define "what comes next" (reusable graph) ──────────────────
function ChainDrawer({ roadmap, candidates, onClose, onSaved }: { roadmap: LinearRoadmap; candidates: LinearRoadmap[]; onClose: () => void; onSaved: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    mentorApi.getRoadmapLinks(roadmap.id)
      .then((r: { data?: { links?: { toRoadmapId: string }[] } }) => setSelected(new Set((r.data?.links || []).map((l) => l.toRoadmapId))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roadmap.id]);

  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const save = async () => {
    setSaving(true);
    try {
      await mentorApi.setRoadmapLinks(roadmap.id, [...selected]);
      toast.success('Next roadmap(s) saved');
      onSaved(); onClose();
    } catch (e) { toast.error(extractApiErrorMessage(e, 'Could not save the chain')); }
    finally { setSaving(false); }
  };

  return (
    <Drawer open onClose={onClose} width="md" title="What comes next" subtitle={`After "${roadmap.name}" completes`}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Save
          </button>
        </>
      }>
      <div className="space-y-3">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-500">
          {selected.size <= 1
            ? 'Pick one — it auto-assigns the moment a mentee finishes this roadmap.'
            : `Pick several to branch — when a mentee finishes, you'll choose which of the ${selected.size} they go to next.`}
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No other roadmaps to chain to yet.</p>
        ) : candidates.map((c) => {
          const on = selected.has(c.id);
          return (
            <button key={c.id} type="button" onClick={() => toggle(c.id)}
              className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${on ? 'border-brand-300 bg-brand-50 dark:bg-brand-500/15' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'}`}>
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'}`}>{on && <Check className="w-3 h-3" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900 truncate">{c.name}</span>
                <span className="block text-xs text-slate-400">{c.steps.length} step{c.steps.length === 1 ? '' : 's'}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Drawer>
  );
}

// ── Roadmap card ──────────────────────────────────────────────────────────────
function RoadmapCard({ r, action }: { r: LinearRoadmap; action: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-slate-900 truncate">{r.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{r.steps.length} step{r.steps.length === 1 ? '' : 's'}</p>
        </div>
        {action}
      </div>
      {r.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{r.description}</p>}
      {r.skillTags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {r.skillTags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
              <Tag className="w-3 h-3" />{t}
            </span>
          ))}
        </div>
      )}
      {r.steps.length > 0 && (
        <ol className="mt-3 space-y-1 border-t border-slate-100 pt-3">
          {r.steps.slice(0, 4).map((s, i) => (
            <li key={s.id} className="text-xs text-slate-500 truncate">{i + 1}. {s.title}</li>
          ))}
          {r.steps.length > 4 && <li className="text-xs text-slate-400">+{r.steps.length - 4} more</li>}
        </ol>
      )}
    </div>
  );
}

export default function MentorRoadmaps() {
  const { local, org, loading, error, refetch } = useMentorRoadmaps();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<LinearRoadmap | null>(null);
  const [assigning, setAssigning] = useState<LinearRoadmap | null>(null);
  const [chaining, setChaining] = useState<LinearRoadmap | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  const onImport = async (id: string) => {
    try {
      setImportingId(id);
      await mentorApi.importRoadmap(id);
      toast.success('Imported to your roadmaps');
      refetch();
    } catch {
      toast.error('Could not import the roadmap');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-slate-900 mb-2">Roadmaps</h1>
          <p className="text-slate-600">Build a sequence of steps, then assign it - approving a step advances the mentee automatically.</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 shrink-0">
          <Plus className="w-4 h-4" />New roadmap
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : error ? (
        <div className="bg-card rounded-2xl border border-slate-200 py-16 text-center">
          <p className="text-slate-600 mb-3">{error}</p>
          <button onClick={refetch} className="text-brand-600 hover:text-brand-700 text-sm font-medium">Try again</button>
        </div>
      ) : (
        <>
          {/* My roadmaps */}
          <section>
            <h2 className="text-slate-900 mb-4 flex items-center gap-2"><Route className="w-4 h-4 text-brand-500" />My roadmaps</h2>
            {local.length === 0 ? (
              <div className="bg-card rounded-2xl border border-slate-200 py-10 text-center">
                <p className="text-slate-600 text-sm">No roadmaps yet - create one or import from your organization below.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {local.map((r) => (
                  <RoadmapCard key={r.id} r={r} action={
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setEditing(r)} title="Edit this roadmap"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:border-brand-300">
                        <Pencil className="w-3.5 h-3.5" />Edit
                      </button>
                      <button onClick={() => setChaining(r)} title="Set what comes next"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:border-brand-300">
                        <GitBranch className="w-3.5 h-3.5" />Next
                      </button>
                      <button onClick={() => setAssigning(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100">
                        <Users className="w-3.5 h-3.5" />Assign
                      </button>
                    </div>
                  } />
                ))}
              </div>
            )}
          </section>

          {/* Org library */}
          {org.length > 0 && (
            <section>
              <h2 className="text-slate-900 mb-4">From your organization</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {org.map((r) => (
                  <RoadmapCard key={r.id} r={r} action={
                    <button onClick={() => onImport(r.id)} disabled={importingId === r.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:border-brand-300 disabled:opacity-50 shrink-0">
                      {importingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Import
                    </button>
                  } />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {creating && <CreateDrawer onClose={() => setCreating(false)} onCreated={refetch} />}
      {editing && <CreateDrawer roadmap={editing} onClose={() => setEditing(null)} onCreated={refetch} />}
      {assigning && <AssignDrawer roadmap={assigning} onClose={() => setAssigning(null)} onAssigned={refetch} />}
      {chaining && <ChainDrawer roadmap={chaining} candidates={[...local, ...org].filter((c) => c.id !== chaining.id)} onClose={() => setChaining(null)} onSaved={refetch} />}
    </div>
  );
}
