import Link from 'next/link';

export function FinalCta() {
  return (
    <section className="container section" aria-labelledby="final-cta-title">
      <div className="cta-panel">
        <h2 id="final-cta-title">Run mentorship like a serious enterprise system.</h2>
        <p>
          Replace fragmented coaching with a measurable infrastructure for capability growth.
        </p>
        <div className="cta-row">
          <Link href="mailto:hello@pathment.me?subject=Pathment%20Request%20Access" className="btn btn-primary">
            Request Access
          </Link>
        </div>
      </div>
    </section>
  );
}
