import { Brand } from './Brand';

export function Footer() {
  return (
    <footer className="footer-shell">
      <div className="container footer-inner">
        <Brand compact />
        <p>Pathment | AI-powered mentorship infrastructure for enterprise teams.</p>
      </div>
    </footer>
  );
}
