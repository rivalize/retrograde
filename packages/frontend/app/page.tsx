import Link from "next/link";
import {
  stack,
  supportedChains,
  tokenUtility,
  workflowSteps
} from "../lib/site-content";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="section-frame hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Phase 2 live | Multi-chain trust infrastructure</p>
          <h1>Retrograde</h1>
          <p className="lede">
            Neon-grade trust surfaces for the agentic economy.
          </p>
          <p className="lede">
            Retrograde scans endpoints, contracts, and repositories across major chains
            before autonomous systems deploy capital, route requests, or ship code. The
            interface now leans into a modern retro TRON aesthetic: deep black, luminous
            cyan, and precision panels with a control-room feel.
          </p>

          <div className="hero-actions">
            <Link className="button button-primary" href="/how-to-use">
              Learn the workflow
            </Link>
            <Link className="button button-secondary" href="/tokenomics">
              Review tokenomics
            </Link>
          </div>

          <dl className="hero-metrics">
            <div>
              <dt>Targets</dt>
              <dd>Endpoints, contracts, repos</dd>
            </div>
            <div>
              <dt>Normalization</dt>
              <dd>Canonical ScanResult schema</dd>
            </div>
            <div>
              <dt>Current reach</dt>
              <dd>4 live EVM chains</dd>
            </div>
          </dl>
        </div>

        <div className="hero-panel panel neon-panel">
          <div className="hero-panel-header">
            <span className="signal-label">Sector map</span>
            <span className="signal-label">Network core</span>
          </div>

          <div className="sector-map" aria-hidden="true">
            <div className="sector-map-grid" />
            <div className="sector-map-ring sector-map-ring-a" />
            <div className="sector-map-ring sector-map-ring-b" />
            <div className="sector-map-node sector-map-node-a" />
            <div className="sector-map-node sector-map-node-b" />
            <div className="sector-map-node sector-map-node-c" />
            <div className="sector-map-route sector-map-route-a" />
            <div className="sector-map-route sector-map-route-b" />
            <div className="sector-map-route sector-map-route-c" />
            <div className="sector-map-label sector-map-label-a">Scan endpoint</div>
            <div className="sector-map-label sector-map-label-b">Registry bridge</div>
            <div className="sector-map-label sector-map-label-c">Trust output</div>
          </div>

          <div className="signal-card">
            <span className="signal-label">Live scanner pulse</span>
            <strong>Healthy on Ethereum, Base, Arbitrum, Optimism.</strong>
            <span>Provider failover, latency bands, registry-bound trust data.</span>
          </div>
        </div>
      </section>

      <section className="section-frame ticker-band" aria-label="Supported chains marquee">
        <div className="ticker-track">
          {supportedChains.concat(supportedChains).map((chain, index) => (
            <span key={`${chain.name}-${index}`} className={`ticker-pill ${chain.accent}`}>
              {chain.name} <em>{chain.status}</em>
            </span>
          ))}
        </div>
      </section>

      <section className="section-frame feature-grid">
        <article className="panel feature-card">
          <p className="eyebrow">User workflow</p>
          <h2>Scan first, decide second</h2>
          <p>
            The workflow is built for operators and agents that need to verify trust before
            they spend funds or ship code.
          </p>
          <Link className="text-link" href="/how-to-use">
            Open the how-to guide
          </Link>
        </article>

        <article className="panel feature-card">
          <p className="eyebrow">Tokenomics</p>
          <h2>RETRO coordinates usage and security</h2>
          <p>
            Scan credits, staking, and registry bonds align network participation with the
            quality of the trust data.
          </p>
          <Link className="text-link" href="/tokenomics">
            Review the token model
          </Link>
        </article>

        <article className="panel feature-card">
          <p className="eyebrow">Roadmap</p>
          <h2>Delivery is already in motion</h2>
          <p>
            The site mirrors the actual phase plan so visitors can see what is live and what
            comes next.
          </p>
          <Link className="text-link" href="/roadmap">
            View the roadmap
          </Link>
        </article>
      </section>

      <section className="section-frame split-layout">
        <article className="panel media-panel">
          <div className="section-heading compact">
            <p className="eyebrow">Brand signal</p>
            <h2>Existing media translated into interface language</h2>
          </div>
          <img
            className="hero-gif"
            src="/brand/retrograde-retro-animated.gif"
            alt="Animated Retrograde glitch banner"
          />
        </article>

        <article className="panel architecture-panel">
          <div className="section-heading compact">
            <p className="eyebrow">Locked stack</p>
            <h2>Infrastructure with hard edges</h2>
          </div>

          <ul className="stack-list">
            {stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <p className="architecture-copy">
            PostgreSQL stores durable scan state. Redis backs Bull queues. The EVM adapter
            runs provider chains with exponential backoff and surfaces p50, p95, and p99
            latency, so trust decisions are measurable instead of anecdotal.
          </p>
        </article>
      </section>

      <section className="section-frame triple-grid">
        <article className="panel status-panel">
          <p className="eyebrow">Current status</p>
          <h2>Scanner core is already live</h2>
          <p>
            Phase 2 is not aspirational copy. The EVM scanner core is shipped for Ethereum,
            Base, Arbitrum, and Optimism, with the remaining chains staged in the roadmap.
          </p>
          <div className="chain-grid">
            {supportedChains.map((chain) => (
              <div key={chain.name} className={`chain-chip ${chain.accent}`}>
                <span>{chain.name}</span>
                <strong>{chain.status}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel utility-panel">
          <p className="eyebrow">Token utility</p>
          <h2>RETRO coordinates usage, staking, and registry security</h2>
          <ul className="bullet-list">
            {tokenUtility.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel roadmap-panel">
          <p className="eyebrow">Roadmap signal</p>
          <h2>What comes after the live EVM core</h2>
          <ul className="bullet-list roadmap-list">
            <li>Phase 2: EVM scanner core is live today.</li>
            <li>Phase 3: Solana adapter and liveness checks.</li>
            <li>Phase 5: RepoScan+ and source correlation.</li>
            <li>Phase 8: Decentralized registry and slashing.</li>
            <li>Phase 9: Wallet-connected dashboard.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}