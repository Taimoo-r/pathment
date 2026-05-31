import { Brand } from './Brand';
import { WorkspaceSignIn } from './WorkspaceSignIn';
import { navItems } from './content';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Brand />
            <div className="hidden items-center gap-6 text-sm font-medium text-zinc-600 md:flex">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="transition-colors hover:text-zinc-950">
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <WorkspaceSignIn />
            <a
              href="#request-access"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md-soft"
            >
              Request Access
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
