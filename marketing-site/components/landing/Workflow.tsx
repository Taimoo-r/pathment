import { workflowSteps } from './content';

export function Workflow() {
  return (
    <section id="workflow" className="container section" aria-labelledby="workflow-title">
      <div className="section-head">
        <p className="eyebrow">How It Works</p>
        <h2 id="workflow-title">A system built on progression, guidance, and outcomes.</h2>
      </div>
      <div className="card-grid">
        {workflowSteps.map((step) => (
          <article key={step.step} className="card">
            <p className="card-step">{step.step}</p>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
