import Link from 'next/link';

interface BrandProps {
  compact?: boolean;
  href?: string;
}

export function Brand({ compact = false, href = '#' }: BrandProps) {
  const box = compact ? 'h-6 w-6' : 'h-7 w-7';
  const glyph = compact ? 'text-xs' : 'text-sm';
  const word = compact ? 'text-base' : 'text-lg';

  return (
    <Link
      href={href}
      aria-label="Pathment home"
      className={`flex items-center gap-2.5 font-display ${word} font-bold tracking-tight text-zinc-900`}
    >
      <span className={`flex ${box} items-center justify-center rounded bg-zinc-900 text-white`}>
        <span className={`font-display font-black ${glyph}`}>P</span>
      </span>
      <span>Pathment</span>
    </Link>
  );
}
