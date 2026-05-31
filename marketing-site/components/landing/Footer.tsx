import { SiGithub, SiX } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa6';
import { Brand } from './Brand';
import { footerColumns } from './content';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 space-y-4 md:col-span-1">
            <Brand compact />
            <p className="text-xs leading-relaxed text-zinc-500">
              AI-powered mentorship infrastructure for high-growth enterprise systems. Align
              development structure to platform performance.
            </p>
            <div className="flex items-center gap-3 text-zinc-400">
              <a href="#" aria-label="GitHub" className="text-base hover:text-zinc-600">
                <SiGithub />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-base hover:text-zinc-600">
                <FaLinkedin />
              </a>
              <a href="#" aria-label="X" className="text-base hover:text-zinc-600">
                <SiX />
              </a>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-900">
                {column.title}
              </h4>
              <ul className="space-y-2 text-xs text-zinc-500">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-zinc-900">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-200/60 pt-8 sm:flex-row">
          <p className="text-xs text-zinc-400">
            &copy; 2026 Pathment Technologies, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All services fully operational
          </div>
        </div>
      </div>
    </footer>
  );
}
