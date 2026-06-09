'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FileJson, ChevronDown, Upload, Copy, Download } from 'lucide-react';
import {
  scheduleTemplateToJsonString, parseScheduleTemplateJson, SCHEDULE_JSON_TEMPLATE,
  type ExportScheduleTemplate, type LoadedBlock,
} from '@/lib/utils/schedule-json';

/**
 * Collapsible "Import / export JSON" panel for the schedule-template editors
 * (mentor + admin share it). `current` is serialized on export; `onLoad` is
 * called with the parsed name/description/blocks so the host editor populates
 * its fields, then the user reviews and saves through the normal path.
 */
export function ScheduleJsonPanel({ current, onLoad }: {
  current: ExportScheduleTemplate;
  onLoad: (data: { name?: string; description?: string; blocks: LoadedBlock[] }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    const res = parseScheduleTemplateJson(text);
    if (!res.ok) { setError(res.error); return; }
    setError(null);
    onLoad(res.data);
    setOpen(false);
    toast.success(`Loaded ${res.data.blocks.length} block${res.data.blocks.length === 1 ? '' : 's'} from JSON — review & save`);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(scheduleTemplateToJsonString(current)); toast.success('Schedule JSON copied'); }
    catch { setText(scheduleTemplateToJsonString(current)); setOpen(true); toast.message('Copied into the box below — select & copy'); }
  };
  const download = () => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([scheduleTemplateToJsonString(current)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(current.name || 'schedule').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setText(String(reader.result || '')); setError(null); setOpen(true); };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium text-slate-700">
        <span className="inline-flex items-center gap-1.5"><FileJson className="w-4 h-4" />Import / export JSON</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { setText(SCHEDULE_JSON_TEMPLATE); setError(null); }} className="text-xs font-medium text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50">Insert template</button>
            <label className="text-xs font-medium text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />Upload .json
              <input type="file" accept="application/json,.json" onChange={upload} className="hidden" />
            </label>
            <button type="button" onClick={copy} className="ml-auto text-xs font-medium text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 inline-flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" />Copy current</button>
            <button type="button" onClick={download} className="text-xs font-medium text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Download</button>
          </div>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setError(null); }} rows={6}
            placeholder='Paste schedule JSON here, or click "Insert template" / "Upload .json"…'
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-brand-500" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="button" onClick={load} disabled={!text.trim()} className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 disabled:opacity-50">Load into editor</button>
          <p className="text-[11px] text-slate-400">Loading replaces the fields above. Review, then Save.</p>
        </div>
      )}
    </div>
  );
}

export default ScheduleJsonPanel;
