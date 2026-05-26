# Retrograde

Retrograde is trust infrastructure for the multi-chain agentic economy. It scans endpoints, smart contracts, and repositories across major chains before agents or developers spend funds or deploy code.

## Phase 2 Status

The EVM scanner core is live for Ethereum, Base, Arbitrum, and Optimism.

## Workspace

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## Services

```bash
docker compose up -d postgres redis
```

PostgreSQL 16 and Redis 7 back scan persistence and Bull queues.

## Packages

- `packages/scanner-core`: canonical zod schemas, Bull scan queue, typed jobs, EVM endpoint worker, and PostgreSQL migrations.
- `packages/evm-adapter`: viem-based EVM adapter with Alchemy, Infura, Chainstack, and public RPC failover.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Tokenomics](docs/TOKENOMICS.md)
- [Roadmap](docs/ROADMAP.md)
