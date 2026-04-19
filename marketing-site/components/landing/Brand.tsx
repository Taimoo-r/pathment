import Image from 'next/image';
import Link from 'next/link';

interface BrandProps {
  compact?: boolean;
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link href="/" className="brand" aria-label="Pathment home">
      <Image
        src="/assets/favicon-32x32.png"
        alt="Pathment symbol"
        width={compact ? 18 : 20}
        height={compact ? 18 : 20}
        priority
      />
      <span className="brand-wordmark">Pathment</span>
    </Link>
  );
}
