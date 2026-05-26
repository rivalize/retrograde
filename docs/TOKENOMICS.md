# Retrograde Tokenomics

`$RETRO` is the utility and coordination token for Retrograde.

## Utility

- Scan credits: users spend `$RETRO` to run endpoint, contract, and repository scans.
- Staking: stakers earn fee share, scan credits, and governance weight.
- Registry bonds: endpoint submitters and disputers bond `$RETRO`; invalid attestations can be slashed.

## Cross-Chain Standard

`$RETRO` uses LayerZero OFT burn-mint semantics for a single canonical supply across EVM chains and Solana. Wrapped-token bridge designs are out of scope.

## Staking Multipliers

| Lock     | Multiplier |
| -------- | ---------- |
| Flexible | 1.00x      |
| 30 days  | 1.15x      |
| 90 days  | 1.35x      |
| 180 days | 1.60x      |
| 365 days | 2.00x      |

## Treasury Split

| Destination      | Share |
| ---------------- | ----- |
| Staking rewards  | 50%   |
| Buyback and burn | 30%   |
| Free credit pool | 20%   |

Epoch length is 7 days.

## Open Questions

- Total `$RETRO` supply.
- Final staking reward percentage splits after testnet data.
- Registry bond minimums.
- Token launch mechanism / TGE structure.
- Governance quorum and proposal thresholds.
