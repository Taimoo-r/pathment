import { ArrowRight } from 'lucide-react';

export function FinalCta() {
  return (
    <section id="request-access" className="relative overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50 px-8 py-16 shadow-sm-soft md:p-20">
          <div className="grid-pattern pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="mb-4 font-display text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Establish precision mentorship at scale
            </h2>
            <p className="mb-10 text-base text-zinc-600">
              See how Pathment aligns continuous personal progression directly to organization
              metrics. Connect with our solution engineering team to design your workspace setup.
            </p>
            <form
              action="mailto:enterprise@pathment.com"
              method="post"
              className="mx-auto flex max-w-md flex-col items-stretch justify-center gap-3 sm:flex-row"
            >
              <input
                type="email"
                name="email"
                placeholder="Enter work email"
                required
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-md-soft transition-all hover:bg-zinc-800"
              >
                Request Invite <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-4 text-xs text-zinc-400">
              For enterprise security configurations or customized RFP reviews, reach us directly at{' '}
              <a
                href="mailto:enterprise@pathment.com"
                className="text-zinc-600 underline hover:text-zinc-900"
              >
                enterprise@pathment.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
