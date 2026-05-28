# Retrograde

Retrograde is trust infrastructure for the multi-chain agentic economy. It scans endpoints, smart contracts, and repositories across major chains before agents or developers spend funds or deploy code.

## Phase Status

The EVM scanner core is live for Ethereum, Base, Arbitrum, and Optimism. The Solana adapter includes JSON-RPC failover, slot liveness checks, and Yellowstone Geyser account subscriptions. The vulnerability scanner normalizes static and dynamic EVM contract findings to `ScanResult`.

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
- `packages/solana-adapter`: Solana JSON-RPC adapter with Helius, Chainstack, public fallback, and Yellowstone Geyser subscription support.
- `packages/vulnerability-scanner`: static EVM bytecode heuristics, dynamic simulation probes, and canonical contract `ScanResult` normalization.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Tokenomics](docs/TOKENOMICS.md)
- [Roadmap](docs/ROADMAP.md)
