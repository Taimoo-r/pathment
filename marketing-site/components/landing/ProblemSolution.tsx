import { AlertCircle, Check, CheckCircle2, X } from 'lucide-react';
import { currentStatePoints, pathmentSystemPoints } from './content';

export function ProblemSolution() {
  return (
    <section
      id="solution"
      className="relative overflow-hidden border-b border-zinc-200/60 bg-zinc-50 py-24"
      aria-labelledby="solution-title"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2
            id="solution-title"
            className="font-display text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl"
          >
            Rethinking operational guidance
          </h2>
          <p className="mt-4 text-base text-zinc-600">
            Legacy mentorship is usually informal, invisible, and impossible to measure. Pathment
            structures engineering development into verifiable system progression.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-8">
            <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-3xl bg-linear-to-bl from-red-50/40 to-transparent" />
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Current State
                </span>
                <h3 className="text-lg font-semibold text-zinc-900">Informal &amp; Invisible</h3>
              </div>
            </div>
            <ul className="space-y-4 text-sm text-zinc-600">
              {currentStatePoints.map((point) => (
                <li key={point.label} className="flex items-start gap-2.5">
                  <X className="mt-1 h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>
                    <strong>{point.label}</strong> {point.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-8 shadow-sm-soft">
            <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-3xl bg-linear-to-bl from-brand-50 to-transparent" />
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-600">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-brand-600">
                  Pathment System
                </span>
                <h3 className="text-lg font-semibold text-zinc-900">Measurable Progression</h3>
              </div>
            </div>
            <ul className="space-y-4 text-sm text-zinc-600">
              {pathmentSystemPoints.map((point) => (
                <li key={point.label} className="flex items-start gap-2.5">
                  <Check className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <span>
                    <strong>{point.label}</strong> {point.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
