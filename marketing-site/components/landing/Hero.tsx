import Link from 'next/link';

export function Hero() {
  return (
    <section className="container hero" aria-labelledby="hero-title">
      <p className="eyebrow">AI-Powered Mentorship Infrastructure</p>
      <h1 id="hero-title">Structured growth, at scale.</h1>
      <p className="lead">
        Pathment gives enterprise teams a precise system for capability growth through guided mentorship,
        measurable progression, and AI-accelerated operational clarity.
      </p>
      <div className="cta-row">
        <Link href="mailto:hello@pathment.me?subject=Pathment%20Get%20Started" className="btn btn-primary">
          Get Started
        </Link>
        <Link href="mailto:hello@pathment.me?subject=Pathment%20Request%20Access" className="btn btn-secondary">
          Request Access
        </Link>
      </div>
    </section>
  );
}
