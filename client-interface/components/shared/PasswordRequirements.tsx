'use client';

import { Check } from 'lucide-react';
import { passwordRules } from '@/lib/utils/validation';

/**
 * Live password-requirements checklist. Each rule turns green as it's met, so a
 * user knows EXACTLY what to type before they submit — no more guessing why a
 * password was rejected. The rules mirror the server's Joi rule one-to-one.
 *
 * Pass `show={false}` to keep it hidden until the user starts typing.
 */
export function PasswordRequirements({ password, show = true }: { password: string; show?: boolean }) {
  if (!show) return null;
  return (
    <ul className="mt-2 grid gap-1" aria-label="Password requirements">
      {passwordRules.map((r) => {
        const met = r.test(password);
        return (
          <li key={r.label} className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-emerald-600' : 'text-slate-400'}`}>
            <span className={`inline-flex w-3.5 h-3.5 items-center justify-center rounded-full border ${met ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
              {met && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
            </span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

export default PasswordRequirements;
