// JSON import/export for SCHEDULE TEMPLATES (name + description + time blocks).
// Same idea as roadmap-json: export → tweak → re-import round-trips cleanly.
// (The per-mentee *filled* schedule isn't covered — it references specific
// roadmap/mentee ids and isn't portable.)

const DAYS = ['everyday', 'weekdays', 'weekends'];

export interface LoadedBlock { label: string; time: string; days: string; bookable: boolean }

interface ExportBlock { label: string; time?: string; days?: string; bookable?: boolean }
export interface ExportScheduleTemplate {
  name: string;
  description?: string | null;
  blocks: ExportBlock[];
}

export const SCHEDULE_JSON_TEMPLATE = `{
  "name": "Bootcamp Day",
  "description": "A balanced day-shape for full-time learners.",
  "blocks": [
    { "label": "Morning check-in", "time": "09:00", "days": "weekdays", "bookable": false },
    { "label": "Core work", "time": "10:00", "days": "weekdays", "bookable": false },
    { "label": "Mentor office hours", "time": "16:00", "days": "weekdays", "bookable": true },
    { "label": "Weekend catch-up", "time": "11:00", "days": "weekends", "bookable": false }
  ]
}`;

export function scheduleTemplateToJsonString(t: ExportScheduleTemplate): string {
  return JSON.stringify({
    name: t.name,
    description: t.description || undefined,
    blocks: (t.blocks || []).map((b) => ({
      label: b.label,
      time: b.time || undefined,
      days: b.days || 'everyday',
      bookable: !!b.bookable,
    })),
  }, null, 2);
}

export function downloadScheduleTemplateJson(t: ExportScheduleTemplate): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([scheduleTemplateToJsonString(t)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(t.name || 'schedule').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Lenient parse: accepts a full object or a bare array of blocks. */
export function parseScheduleTemplateJson(text: string):
  { ok: true; data: { name?: string; description?: string; blocks: LoadedBlock[] } } | { ok: false; error: string } {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { ok: false, error: "That isn't valid JSON — check for missing commas or quotes." }; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = parsed as any;
  const rawBlocks = Array.isArray(p) ? p : (Array.isArray(p?.blocks) ? p.blocks : null);
  if (!rawBlocks) return { ok: false, error: 'Expected an object with a "blocks" array (or an array of blocks).' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks: LoadedBlock[] = rawBlocks.filter((b: any) => b && b.label != null).map((b: any) => ({
    label: String(b.label || '').slice(0, 150),
    time: typeof b.time === 'string' ? b.time : '',
    days: DAYS.includes(String(b.days)) ? String(b.days) : 'everyday',
    bookable: !!b.bookable,
  }));
  if (blocks.length === 0) return { ok: false, error: 'No blocks with a "label" were found.' };
  const data: { name?: string; description?: string; blocks: LoadedBlock[] } = { blocks };
  if (!Array.isArray(p)) {
    if (typeof p.name === 'string') data.name = p.name;
    if (typeof p.description === 'string') data.description = p.description;
  }
  return { ok: true, data };
}
