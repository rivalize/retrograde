# Recovery Chat Draft

Last updated: 2026-05-26 21:38 CDT

Use this file to restart work in a fresh chat if context is lost.

## Repository

- GitHub: `rivalize/retrograde`
- Local path: `/Users/corbinpaulson/Documents/New project/retrograde`
- Package manager: `pnpm@8.15.9`
- Current branch: `feat/vulnerability-scanner-core`
- Current local phase commit in progress: Phase 4 vulnerability scanner

## Current State

Phase 1, Phase 2, Phase 3, and Phase 4 are complete in the roadmap.

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

## GitHub Links

- Phase 2 branch: `feat/evm-adapter-core`
- Phase 2 was merged into `main` via PR #1.
- Phase 3 branch: `feat/solana-adapter-core`
- Phase 3 PR creation link: `https://github.com/rivalize/retrograde/pull/new/feat/solana-adapter-core`
- Phase 4 branch: `feat/vulnerability-scanner-core`

## Next Phase Boundary

Do not start Phase 5 until Phase 3 and Phase 4 are merged and CI is green.

Next planned work:

- Phase 5 - RepoScan+
- GitHub repository scanner
- GitLab repository scanner
- Bitbucket repository scanner
- On-chain bytecode source correlation

Before coding any next phase:

1. Sync `main` from GitHub.
2. Read `docs/ARCHITECTURE.md`.
3. Read `docs/ROADMAP.md`.
4. Create a new phase branch.
5. Commit in small conventional commits and push after each logical milestone.

## Recovery Prompt

Paste this into a new chat if needed:

```text
We are building rivalize/retrograde. Work locally in /Users/corbinpaulson/Documents/New project/retrograde. Read docs/ARCHITECTURE.md and docs/ROADMAP.md first. Phase 2 is merged. Phase 3 is on branch feat/solana-adapter-core and Phase 4 is on branch feat/vulnerability-scanner-core. Verify whether Phase 3 and Phase 4 have been merged before starting new work. If merged, sync main and start Phase 5 only. Preserve the locked stack: pnpm, TypeScript strict, Fastify, Bull, viem, web3.js Solana, Yellowstone gRPC, zod, Vitest. Commit frequently with conventional commits and push each completed milestone.
```
