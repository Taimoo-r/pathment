import { enterprisePillars } from './content';

export function Enterprise() {
  return (
    <section id="enterprise" className="container section" aria-labelledby="enterprise-title">
      <div className="section-head">
        <p className="eyebrow">Enterprise Credibility</p>
        <h2 id="enterprise-title">Security, scalability, and control built into the core system.</h2>
      </div>
      <div className="card-grid">
        {enterprisePillars.map((pillar) => (
          <article key={pillar.title} className="card">
            <h3>{pillar.title}</h3>
            <p>{pillar.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
