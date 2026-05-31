import { Check } from 'lucide-react';
import { currentStatePoints, pathmentSystemPoints } from './content';

export function ProblemSolution() {
  return (
    <section
      id="solution"
      className="border-b border-zinc-200/60 bg-zinc-50 py-24"
      aria-labelledby="solution-title"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2
            id="solution-title"
            className="font-display text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl"
          >
            Rethinking operational guidance
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600">
            Legacy mentorship is usually informal, invisible, and impossible to measure. Pathment
            structures engineering development into verifiable progression.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {/* Today */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Today
            </span>
            <h3 className="mt-2 mb-7 text-xl font-semibold text-zinc-900">
              Informal &amp; invisible
            </h3>
            <ul className="space-y-5">
              {currentStatePoints.map((point) => (
                <li key={point.label} className="flex gap-3">
                  <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-300" />
                  <span className="text-sm leading-relaxed text-zinc-600">
                    <span className="font-medium text-zinc-900">{point.label}</span> {point.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* With Pathment */}
          <div className="rounded-2xl border border-brand-200 bg-white p-8 shadow-sm-soft ring-1 ring-brand-500/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              With Pathment
            </span>
            <h3 className="mt-2 mb-7 text-xl font-semibold text-zinc-900">
              Measurable progression
            </h3>
            <ul className="space-y-5">
              {pathmentSystemPoints.map((point) => (
                <li key={point.label} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                  <span className="text-sm leading-relaxed text-zinc-600">
                    <span className="font-medium text-zinc-900">{point.label}</span> {point.body}
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
