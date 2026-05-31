import { workflowSteps } from './content';

export function Workflow() {
  return (
    <section
      id="how-it-works"
      className="border-b border-zinc-200/60 bg-white py-24"
      aria-labelledby="how-it-works-title"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-600">
            ENGINEERING PROGRESSION ENGINE
          </div>
          <h2
            id="how-it-works-title"
            className="font-display text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl"
          >
            A structured cycle for continuous growth
          </h2>
          <p className="mt-4 text-base text-zinc-600">
            Unlike legacy portals, Pathment functions as structural infrastructure. We orchestrate
            alignment across three core execution cycles.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-3">
          {workflowSteps.map((step) => (
            <div key={step.step} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="rounded bg-zinc-100 px-2.5 py-1 font-mono text-xs font-bold text-zinc-400">
                  {step.step}
                </span>
                <span className="h-px flex-1 bg-zinc-200" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">{step.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
