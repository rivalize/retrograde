# Retrograde Architecture

Retrograde is trust infrastructure for the multi-chain agentic economy. It scans x402 endpoints, smart contracts, and code repositories across major chains, normalizes all findings into a canonical `ScanResult`, and publishes verified endpoint state through a decentralized registry.

## Locked Stack

| Layer              | Technology                                            |
| ------------------ | ----------------------------------------------------- |
| Language           | TypeScript 5.x strict                                 |
| Package manager    | pnpm workspaces                                       |
| Backend framework  | Fastify                                               |
| Job queue          | Bull on Redis                                         |
| EVM library        | viem                                                  |
| EVM RPC            | Alchemy primary, Infura fallback, public RPC fallback |
| Solana RPC         | Helius plus Yellowstone Geyser, Chainstack fallback   |
| EVM contracts      | Solidity and Hardhat                                  |
| Solana programs    | Anchor                                                |
| Cross-chain bridge | LayerZero OFT burn-mint                               |
| Database           | PostgreSQL 16                                         |
| Cache / queue      | Redis 7                                               |
| Frontend           | Next.js 14 App Router                                 |
| Validation         | zod                                                   |
| Testing            | Vitest, Hardhat, Anchor                               |

## Supported Chains

| Chain       | Type   | Chain ID | Primary RPC | Fallback   |
| ----------- | ------ | -------- | ----------- | ---------- |
| Ethereum    | L1 EVM | 1        | Alchemy     | Infura     |
| Base        | L2 EVM | 8453     | Alchemy     | Infura     |
| Arbitrum    | L2 EVM | 42161    | Alchemy     | Infura     |
| Optimism    | L2 EVM | 10       | Alchemy     | Infura     |
| Polygon     | L1 EVM | 137      | Alchemy     | Chainstack |
| BNB Chain   | L1 EVM | 56       | Chainstack  | Public     |
| Avalanche C | L1 EVM | 43114    | Chainstack  | Public     |
| Solana      | L1     | -        | Helius      | Chainstack |

## Monorepo Packages

| Package                     | Purpose                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `packages/scanner-core`     | Chain-agnostic scan schemas, queue orchestration, job types, and scan result persistence schema.     |
| `packages/evm-adapter`      | Shared viem-based adapter for all EVM chains with provider failover and endpoint health measurement. |
| `packages/solana-adapter`   | Solana JSON-RPC and Yellowstone Geyser adapter. Phase 3.                                             |
| `packages/contracts-evm`    | Solidity contracts: RetroToken, RetroStaking, ScanCredits, Registry, Treasury. Phase 6.              |
| `packages/contracts-solana` | Anchor programs: retro_token and retro_staking. Phase 7.                                             |
| `packages/registry-api`     | Fastify REST API for the registry backend.                                                           |
| `packages/frontend`         | Next.js dashboard.                                                                                   |

## Canonical Schemas

```typescript
type ChainId =
  | "ethereum"
  | "base"
  | "arbitrum"
  | "optimism"
  | "polygon"
  | "bnb"
  | "avalanche"
  | "solana";

interface ScanResult {
  id: string;
  chain: ChainId;
  target: string;
  targetType: "endpoint" | "contract" | "repo";
  status: "healthy" | "degraded" | "down" | "vulnerable";
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  vulnerabilities: Vulnerability[];
  checkedAt: Date;
  metadata: Record<string, unknown>;
}

interface Vulnerability {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  type: string;
  description: string;
  location?: string;
}

interface EndpointHealth {
  url: string;
  status: "healthy" | "degraded" | "down";
  statusCode?: number;
  latencyMs: number;
  checkedAt: Date;
  error?: string;
}
```

## EVM Adapter

All EVM chains use one base adapter. The adapter must:

- Use `viem`.
- Build provider chains in this order where available: Alchemy, Infura, public RPC.
- Retry provider operations with exponential backoff before failing over.
- Validate addresses before contract reads.
- Measure endpoint latency and expose p50, p95, and p99 distribution data for scan jobs.
- Provide liveness through `getBlockNumber()`.

## Scanner Core

Scanner core owns the canonical zod schemas, Bull queues, typed scan job payloads, and PostgreSQL schema for persisted scan results. Phase 2 must wire a `scan:endpoint` job to the EVM adapter and normalize output to `ScanResult`.

## Persistence

PostgreSQL is the durable store. Redis backs Bull queues. Phase 2 requires a `scan_results` table with JSONB fields for latency, vulnerabilities, and metadata.

## Smart Contracts

EVM contracts use pinned Solidity versions, OpenZeppelin primitives, and LayerZero OFT burn-mint semantics. No admin mint function is allowed after genesis. Solana programs use Anchor, explicit constraints, access-control helpers, and descriptive error codes.
