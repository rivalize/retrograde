import PageShell from "../../components/page-shell";
import { roadmapPhases } from "../../lib/site-content";

export default function RoadmapPage() {
  return (
    <PageShell
      eyebrow="Roadmap"
      title="The build path from scanner core to decentralized registry"
      intro="The roadmap is organized around live infrastructure first, then adapter expansion, then registry and frontend depth."
    >
      <section className="section-frame">
        <div className="timeline-grid">
          {roadmapPhases.map((phase) => (
            <article key={phase.phase} className="panel timeline-card">
              <div className="timeline-head">
                <span className="timeline-phase">{phase.phase}</span>
                <span className={`timeline-status ${phase.status.toLowerCase()}`}>{phase.status}</span>
              </div>
              <h2>{phase.title}</h2>
              <p>{phase.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-frame split-layout">
        <article className="panel">
          <p className="eyebrow">Immediate focus</p>
          <h2>What happens next</h2>
          <ul className="bullet-list">
            <li>Solana adapter and live slot liveness checks.</li>
            <li>Vulnerability normalization into the canonical scan result model.</li>
            <li>Repository scanners and bytecode source correlation.</li>
            <li>Registry attestations, dispute bonds, and slashing.</li>
          </ul>
        </article>

        <article className="panel">
          <p className="eyebrow">Delivery note</p>
          <h2>Current milestone</h2>
          <p>
            Phase 2 is already live, so the product is not a concept page. The remaining
            work expands the network coverage and deepens the trust graph around it.
          </p>
        </article>
      </section>
    </PageShell>
  );
}
