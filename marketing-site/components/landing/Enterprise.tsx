import { Building2, Lock, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { enterprisePillars } from './content';

const icons: Record<string, LucideIcon> = {
  workspace: Building2,
  roles: Users,
  auth: Lock,
};

export function Enterprise() {
  return (
    <section
      id="enterprise"
      className="border-b border-zinc-200/60 bg-white py-24"
      aria-labelledby="enterprise-title"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-600">
            BUILT FOR ORGANIZATIONS
          </div>
          <h2
            id="enterprise-title"
            className="font-display text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl"
          >
            Isolated workspaces, clear roles, secure access
          </h2>
          <p className="mt-4 text-base text-zinc-600">
            Pathment is structured so every organization runs its own mentorship program
            independently, with the right experience for each role and straightforward, secure
            sign-in for everyone involved.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {enterprisePillars.map((pillar) => {
            const Icon = icons[pillar.icon];
            return (
              <div
                key={pillar.title}
                className="rounded-2xl border border-zinc-100 bg-[#fcfcfd] p-7 transition-colors duration-200 hover:border-zinc-200 hover:bg-white"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-zinc-900" />
                  <h3 className="font-semibold text-zinc-900">{pillar.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-zinc-600">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
