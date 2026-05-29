import Link from "next/link";
import PageShell from "../../components/page-shell";
import { supportedChains, workflowSteps } from "../../lib/site-content";

export default function HowToUsePage() {
  return (
    <PageShell
      eyebrow="How to Use"
      title="A clean operator workflow for scanning before you trust"
      intro="Retrograde is designed for the moment before an agent spends money, a developer ships code, or an integration gets promoted to production."
    >
      <section className="section-frame section-grid">
        <div className="workflow-grid">
          {workflowSteps.map((item) => (
            <article key={item.step} className="panel workflow-card">
              <span className="step-index">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-frame split-layout">
        <article className="panel">
          <p className="eyebrow">Supported targets</p>
          <h2>What the scanner expects</h2>
          <ul className="bullet-list">
            <li>x402 or HTTP endpoints that need trust verification.</li>
            <li>Smart contracts that should be checked before deployment or integration.</li>
            <li>Repositories that need source and security review before an agent consumes them.</li>
          </ul>
        </article>

        <article className="panel">
          <p className="eyebrow">Live coverage</p>
          <h2>Current chain reach</h2>
          <div className="chain-grid">
            {supportedChains.map((chain) => (
              <div key={chain.name} className={`chain-chip ${chain.accent}`}>
                <span>{chain.name}</span>
                <strong>{chain.status}</strong>
              </div>
            ))}
          </div>
          <p className="architecture-copy">
            Ethereum, Base, Arbitrum, and Optimism are live today. Polygon, BNB Chain,
            Avalanche, and Solana are staged for the next phases.
          </p>
        </article>
      </section>

      <section className="section-frame">
        <article className="panel callout-panel">
          <p className="eyebrow">Operational tip</p>
          <h2>Use Retrograde before the trust decision, not after the incident</h2>
          <p>
            The product is most valuable when it sits in the control path: before a wallet
            transaction, before a deployment, or before an agent begins a workflow with
            external dependencies.
          </p>
          <Link className="button button-primary" href="/tokenomics">
            See the incentive model
          </Link>
        </article>
      </section>
    </PageShell>
  );
}
