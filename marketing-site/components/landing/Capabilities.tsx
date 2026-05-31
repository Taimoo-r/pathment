import { GitBranch, Sparkles, Trophy, Users } from 'lucide-react';

export function Capabilities() {
  return (
    <section
      id="capabilities"
      className="relative border-b border-zinc-200/60 bg-zinc-50 py-24"
      aria-labelledby="capabilities-title"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-600">
            PRODUCT CAPABILITIES
          </div>
          <h2
            id="capabilities-title"
            className="font-display text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl"
          >
            Built for rigorous internal engineering ecosystems
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-8 shadow-sm-soft md:col-span-2">
            <div>
              <span className="mb-6 flex h-9 w-9 items-center justify-center rounded border border-brand-100 bg-brand-50 text-brand-600">
                <Users className="h-5 w-5" />
              </span>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900">Smart Mentor Matching</h3>
              <p className="mb-6 max-w-xl text-sm leading-relaxed text-zinc-600">
                Pair mentees with the right mentors based on skills, goals, and availability. Admins
                review and approve every match, and the full submission-to-review lifecycle stays
                visible and linked to each mentee&apos;s progression profile.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-6">
              <div>
                <span className="block text-xs font-bold uppercase text-zinc-400">Matching</span>
                <span className="text-sm font-medium text-zinc-800">
                  Skill, goal &amp; availability based
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-zinc-400">Oversight</span>
                <span className="text-sm font-medium text-zinc-800">
                  Admin-approved assignments
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-8 shadow-sm-soft">
            <div>
              <span className="mb-6 flex h-9 w-9 items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-zinc-700">
                <GitBranch className="h-5 w-5" />
              </span>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900">AI-Generated Roadmaps</h3>
              <p className="text-sm leading-relaxed text-zinc-600">
                AI analyzes each mentee&apos;s goals and skill gaps to generate a structured learning
                roadmap, broken into actionable tasks and adjusted as they progress.
              </p>
            </div>
            <div className="border-t border-zinc-100 pt-6">
              <span className="mb-1 block text-xs font-semibold text-zinc-400">Always current:</span>
              <span className="text-xs text-zinc-600">
                Milestones and tasks adapt automatically to real progress.
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-8 shadow-sm-soft">
            <div>
              <span className="mb-6 flex h-9 w-9 items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-zinc-700">
                <Sparkles className="h-5 w-5" />
              </span>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900">Outcome Insights</h3>
              <p className="text-sm leading-relaxed text-zinc-600">
                Track program wellness in real time, surface mentees who are stalling, and give
                leaders clear summaries to inform promotion and readiness decisions.
              </p>
            </div>
            <div className="border-t border-zinc-100 pt-6">
              <span className="mb-1 block text-xs font-semibold text-zinc-400">Real-time view:</span>
              <span className="text-xs text-zinc-600">
                Completion health and capability growth at a glance.
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-8 shadow-sm-soft md:col-span-2">
            <div>
              <span className="mb-6 flex h-9 w-9 items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-zinc-700">
                <Trophy className="h-5 w-5" />
              </span>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900">
                Gamified Progress &amp; Motivation
              </h3>
              <p className="mb-4 max-w-xl text-sm leading-relaxed text-zinc-600">
                Completing tasks earns points, milestones unlock badges, and leaderboards add
                friendly competition. Mentees stay motivated while their skill growth is tracked over
                time &mdash; turning learning into measurable momentum.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-6">
              {['Points', 'Badges', 'Leaderboards', 'Streaks'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
