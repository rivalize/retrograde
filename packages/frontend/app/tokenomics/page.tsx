import PageShell from "../../components/page-shell";
import { stakingMultipliers, tokenomicsTable, treasurySplit } from "../../lib/site-content";

export default function TokenomicsPage() {
  return (
    <PageShell
      eyebrow="Tokenomics"
      title="RETRO aligns scanning, staking, and registry security"
      intro="The token model is built around usage, validator-style incentives, and registry accountability instead of speculative ornament."
    >
      <section className="section-frame split-layout">
        <article className="panel">
          <p className="eyebrow">Utility</p>
          <h2>What RETRO is for</h2>
          <div className="spec-list">
            {tokenomicsTable.map((item) => (
              <div key={item.label} className="spec-row">
                <span>{item.label}</span>
                <p>{item.value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Staking multipliers</p>
          <h2>Longer locks earn stronger weight</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Lock</th>
                <th>Multiplier</th>
              </tr>
            </thead>
            <tbody>
              {stakingMultipliers.map((row) => (
                <tr key={row.lock}>
                  <td>{row.lock}</td>
                  <td>{row.multiplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>

      <section className="section-frame split-layout">
        <article className="panel">
          <p className="eyebrow">Treasury split</p>
          <h2>How protocol revenue is allocated</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Destination</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {treasurySplit.map((row) => (
                <tr key={row.destination}>
                  <td>{row.destination}</td>
                  <td>{row.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="panel">
          <p className="eyebrow">Open questions</p>
          <h2>Items still to finalize</h2>
          <ul className="bullet-list">
            <li>Total RETRO supply.</li>
            <li>Final reward splits after testnet data.</li>
            <li>Registry bond minimums.</li>
            <li>TGE and launch mechanics.</li>
            <li>Governance quorum and proposal thresholds.</li>
          </ul>
        </article>
      </section>
    </PageShell>
  );
}
