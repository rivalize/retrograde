# Recovery Chat Draft

Last updated: 2026-05-26 20:47 CDT

Use this file to restart work in a fresh chat if context is lost.

## Repository

- GitHub: `rivalize/retrograde`
- Local path: `/Users/corbinpaulson/Documents/New project/retrograde`
- Package manager: `pnpm@8.15.9`
- Current branch: `feat/solana-adapter-core`
- Current pushed commit: `f9d4ba4 feat(solana): add adapter core`

## Current State

Phase 1, Phase 2, and Phase 3 are complete in the roadmap.

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

## GitHub Links

- Phase 2 branch: `feat/evm-adapter-core`
- Phase 2 was merged into `main` via PR #1.
- Phase 3 branch: `feat/solana-adapter-core`
- Phase 3 PR creation link: `https://github.com/rivalize/retrograde/pull/new/feat/solana-adapter-core`

## Next Phase Boundary

Do not start Phase 4 until Phase 3 is merged and CI is green.

Next planned work:

- Phase 4 - Vulnerability scanner
- Static contract analysis
- Dynamic simulation analysis
- Vulnerability normalization to `ScanResult`

Before coding any next phase:

1. Sync `main` from GitHub.
2. Read `docs/ARCHITECTURE.md`.
3. Read `docs/ROADMAP.md`.
4. Create a new phase branch.
5. Commit in small conventional commits and push after each logical milestone.

## Recovery Prompt

Paste this into a new chat if needed:

```text
We are building rivalize/retrograde. Work locally in /Users/corbinpaulson/Documents/New project/retrograde. Read docs/ARCHITECTURE.md and docs/ROADMAP.md first. Phase 2 is merged. Phase 3 is on branch feat/solana-adapter-core at commit f9d4ba4 and pushed to GitHub. Verify whether Phase 3 has been merged before starting new work. If merged, sync main and start Phase 4 only. Preserve the locked stack: pnpm, TypeScript strict, Fastify, Bull, viem, web3.js Solana, Yellowstone gRPC, zod, Vitest. Commit frequently with conventional commits and push each completed milestone.
```
