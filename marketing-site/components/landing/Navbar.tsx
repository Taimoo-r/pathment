import Link from 'next/link';
import { Brand } from './Brand';
import { navItems } from './content';

export function Navbar() {
  return (
    <header className="nav-shell">
      <div className="container nav-inner">
        <Brand />
        <nav className="nav-items" aria-label="Primary">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="nav-link">
              {item.label}
            </a>
          ))}
        </nav>
        <Link href="mailto:hello@pathment.me?subject=Pathment%20Request%20Access" className="btn btn-secondary">
          Request Access
        </Link>
      </div>
    </header>
  );
}
