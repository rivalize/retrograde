# Recovery Chat Draft

Last updated: 2026-05-29 05:29 CDT

Use this file to restart work in a fresh chat if context is lost.

## Repository

- GitHub: `rivalize/retrograde`
- Local path: `/Users/corbinpaulson/Documents/New project/retrograde`
- Package manager: `pnpm@8.15.9`
- Current branch: `feat/reposcan-core`
- Current local phase commit in progress: Phase 5 RepoScan+

## Current State

Phase 1 through Phase 5 are complete in the roadmap.

Phase 2 shipped:

- pnpm workspace, root scripts, Docker Postgres/Redis, `.env.example`
- `packages/scanner-core`
- `packages/evm-adapter`
- EVM endpoint scanning, bytecode reads, block liveness, failover, and tests

Phase 3 shipped:

- `packages/solana-adapter`
- Solana JSON-RPC provider descriptors and web3.js adapter
- Helius primary RPC, Chainstack fallback, public RPC fallback
- `getAccountInfo()`, `getProgramAccounts()`, `getSlot()`, `getLatency()`
- Yellowstone Geyser account subscriptions through `@triton-one/yellowstone-grpc`
- Solana websocket account subscription fallback
- zod schemas, typed errors, provider failover with exponential backoff
- Vitest coverage above 80%

Phase 4 shipped:

- `packages/vulnerability-scanner`
- Static EVM bytecode heuristics for missing bytecode, dangerous opcodes, upgradeability markers, `tx.origin`, and timestamp usage
- Dynamic read-only EVM simulation probes through `simulateTransaction()`
- Vulnerability normalization to canonical `Vulnerability`
- Contract scan normalization to canonical `ScanResult`
- Analyzer evidence in scan metadata
- Vitest coverage above 80%

Phase 5 shipped:

- `packages/repo-scanner`
- GitHub repository scanner
- GitLab repository scanner
- Bitbucket repository scanner
- Source heuristics for exposed secrets, risky package manifests, risky CI workflows, and missing `SECURITY.md`
- Optional on-chain bytecode correlation against repository build artifacts
- Repository scan normalization to canonical `ScanResult`
- Vitest coverage above 80%

## Verification

Latest full verification passed:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Live smoke checks:

- Phase 2 EVM liveness succeeded on Ethereum, Base, Arbitrum, and Optimism.
- Phase 3 Solana liveness succeeded at slot `422404581` with `116.49ms` observed latency.
- Phase 4 package verification succeeded with `pnpm --filter @retrograde/vulnerability-scanner test` and `pnpm --filter @retrograde/vulnerability-scanner build`.
- Phase 5 package verification succeeded with `pnpm --filter @retrograde/repo-scanner test` and `pnpm --filter @retrograde/repo-scanner typecheck`.

## GitHub Links

- Phase 2 branch: `feat/evm-adapter-core`
- Phase 2 was merged into `main` via PR #1.
- Phase 3 and Phase 4 were direct-merged into `main` on 2026-05-28 at commit `071b693`.
- Phase 5 branch: `feat/reposcan-core`

## Next Phase Boundary

Do not start Phase 6 until Phase 5 is merged and CI is green.

Next planned work:

- Phase 6 - EVM smart contracts
- RetroToken LayerZero OFT
- RetroStaking
- ScanCredits
- Registry
- Treasury
- Hardhat test suite

Before coding any next phase:

1. Sync `main` from GitHub.
2. Read `docs/ARCHITECTURE.md`.
3. Read `docs/ROADMAP.md`.
4. Create a new phase branch.
5. Commit in small conventional commits and push after each logical milestone.

## Recovery Prompt

Paste this into a new chat if needed:

```text
We are building rivalize/retrograde. Work locally in /Users/corbinpaulson/Documents/New project/retrograde. Read docs/ARCHITECTURE.md and docs/ROADMAP.md first. Phase 2, Phase 3, and Phase 4 are merged to main. Phase 5 is on branch feat/reposcan-core. Verify whether Phase 5 has been merged before starting new work. If merged, sync main and start Phase 6 only. Preserve the locked stack: pnpm, TypeScript strict, Fastify, Bull, viem, web3.js Solana, Yellowstone gRPC, zod, Vitest. Commit frequently with conventional commits and push each completed milestone.
```
