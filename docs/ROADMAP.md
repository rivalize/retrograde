# Retrograde Roadmap

## Phase 1 - Repository Foundation

- [x] README.md
- [x] CONTRIBUTING.md
- [x] docs/ARCHITECTURE.md
- [x] docs/TOKENOMICS.md
- [x] docs/ROADMAP.md
- [x] .github/workflows/ci.yml
- [x] .github/ISSUE_TEMPLATE/bug_report.md
- [x] .github/ISSUE_TEMPLATE/feature_request.md
- [x] .github/pull_request_template.md
- [x] media-files branding assets

## Phase 2 - EVM Scanner Core

- [x] pnpm-workspace.yaml
- [x] Root package.json with workspace scripts
- [x] docker-compose.yml (PostgreSQL 16 + Redis 7)
- [x] .env.example (all vars documented)
- [x] packages/scanner-core - ScanResult zod schema, Bull queue, job types
- [x] packages/evm-adapter - viem client, Alchemy + Infura providers
- [x] checkEndpoint() with p50/p95/p99 latency measurement
- [x] getContractBytecode()
- [x] getBlockNumber() chain liveness
- [x] Multi-provider failover with exponential backoff
- [x] PostgreSQL scan_results table schema + migrations
- [x] scan:endpoint Bull job type wired to evm-adapter
- [x] Vitest unit tests - 80%+ coverage on evm-adapter
- [x] Live on: Ethereum, Base, Arbitrum, Optimism

## Phase 3 - Solana Adapter

- [x] Solana JSON-RPC adapter
- [x] Helius primary RPC
- [x] Chainstack fallback
- [x] Yellowstone Geyser subscription support
- [x] Slot liveness checks

## Phase 4 - Vulnerability Scanner

- [ ] Static contract analysis
- [ ] Dynamic simulation analysis
- [ ] Vulnerability normalization to `ScanResult`

## Phase 5 - RepoScan+

- [ ] GitHub repository scanner
- [ ] GitLab repository scanner
- [ ] Bitbucket repository scanner
- [ ] On-chain bytecode source correlation

## Phase 6 - EVM Smart Contracts

- [ ] RetroToken LayerZero OFT
- [ ] RetroStaking
- [ ] ScanCredits
- [ ] Registry
- [ ] Treasury
- [ ] Hardhat test suite

## Phase 7 - Solana Programs

- [ ] retro_token Anchor program
- [ ] retro_staking Anchor program
- [ ] Anchor test suite

## Phase 8 - Decentralized Registry

- [ ] Endpoint submission
- [ ] Attestation workflow
- [ ] Bond disputes
- [ ] Slashing

## Phase 9 - Frontend

- [ ] Next.js 14 dashboard
- [ ] EVM wallet support with wagmi
- [ ] Solana wallet support
- [ ] Scanner workflows
- [ ] Registry views

## Phase 10 - Testnet + Audit

- [ ] EVM testnet deployments
- [ ] Solana devnet deployments
- [ ] Public testnet scanner
- [ ] External audit readiness package

## Phase 11 - Mainnet Launch

- [ ] Mainnet deployments
- [ ] Registry governance bootstrap
- [ ] Production monitoring
