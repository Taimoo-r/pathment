import { capabilities } from './content';

export function Capabilities() {
  return (
    <section id="capabilities" className="container section" aria-labelledby="capabilities-title">
      <div className="section-head">
        <p className="eyebrow">Product Capabilities</p>
        <h2 id="capabilities-title">Operational infrastructure for mentorship at enterprise scale.</h2>
      </div>
      <div className="card-grid">
        {capabilities.map((capability) => (
          <article key={capability.title} className="card">
            <h3>{capability.title}</h3>
            <ul>
              {capability.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
