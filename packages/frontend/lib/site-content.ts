export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-to-use", label: "How to Use" },
  { href: "/tokenomics", label: "Tokenomics" },
  { href: "/roadmap", label: "Roadmap" }
] as const;

export const supportedChains = [
  { name: "Ethereum", status: "Live", accent: "pink" },
  { name: "Base", status: "Live", accent: "teal" },
  { name: "Arbitrum", status: "Live", accent: "pink" },
  { name: "Optimism", status: "Live", accent: "teal" },
  { name: "Polygon", status: "Queued", accent: "pink" },
  { name: "BNB Chain", status: "Queued", accent: "teal" },
  { name: "Avalanche", status: "Queued", accent: "pink" },
  { name: "Solana", status: "Phase 3", accent: "teal" }
] as const;

export const workflowSteps = [
  {
    step: "01",
    title: "Point Retrograde at the target",
    copy:
      "Submit an x402 endpoint, contract address, or repository before agents spend funds, call contracts, or ship integrations."
  },
  {
    step: "02",
    title: "Run chain-aware diagnostics",
    copy:
      "The scanner fans out through provider failover, measures latency distributions, checks liveness, and flags vulnerabilities in one canonical pass."
  },
  {
    step: "03",
    title: "Normalize everything to ScanResult",
    copy:
      "Every finding becomes typed trust data: target class, health state, latency bands, vulnerabilities, and chain-specific metadata."
  },
  {
    step: "04",
    title: "Publish verified state",
    copy:
      "Retrograde feeds a decentralized registry so builders, agents, and infrastructure markets can route around degraded or malicious targets."
  }
] as const;

export const stack = [
  "Fastify registry API",
  "Bull queues on Redis 7",
  "PostgreSQL 16 persistence",
  "viem EVM adapter failover",
  "zod canonical schemas",
  "Next.js 14 dashboard"
] as const;

export const tokenUtility = [
  "Spend RETRO for endpoint, contract, and repository scans.",
  "Stake RETRO for fee share, scan credits, and governance weight.",
  "Bond RETRO for registry attestations and disputes."
] as const;

export const tokenomicsTable = [
  { label: "Scan credits", value: "Users spend RETRO to run endpoint, contract, and repo scans." },
  { label: "Staking", value: "Stakers earn fee share, scan credits, and governance weight." },
  { label: "Registry bonds", value: "Submitters and disputers post RETRO and can be slashed for invalid claims." },
  { label: "Cross-chain standard", value: "LayerZero OFT burn-mint with a single canonical supply across EVM chains and Solana." },
  { label: "Epoch length", value: "7 days." }
] as const;

export const stakingMultipliers = [
  { lock: "Flexible", multiplier: "1.00x" },
  { lock: "30 days", multiplier: "1.15x" },
  { lock: "90 days", multiplier: "1.35x" },
  { lock: "180 days", multiplier: "1.60x" },
  { lock: "365 days", multiplier: "2.00x" }
] as const;

export const treasurySplit = [
  { destination: "Staking rewards", share: "50%" },
  { destination: "Buyback and burn", share: "30%" },
  { destination: "Free credit pool", share: "20%" }
] as const;

export const roadmapPhases = [
  {
    phase: "Phase 2",
    title: "EVM scanner core",
    status: "Live",
    description:
      "Ethereum, Base, Arbitrum, and Optimism are already covered with canonical scan normalization."
  },
  {
    phase: "Phase 3",
    title: "Solana adapter",
    status: "Planned",
    description:
      "Helius primary RPC, Yellowstone Geyser subscriptions, and Chainstack fallback for slot liveness."
  },
  {
    phase: "Phase 4",
    title: "Vulnerability scanner",
    status: "Planned",
    description:
      "Static contract analysis, dynamic simulation, and normalized vulnerability output."
  },
  {
    phase: "Phase 5",
    title: "RepoScan+",
    status: "Planned",
    description:
      "GitHub, GitLab, and Bitbucket scans with on-chain bytecode source correlation."
  },
  {
    phase: "Phase 8",
    title: "Decentralized registry",
    status: "Planned",
    description:
      "Endpoint submission, attestations, bond disputes, and slashing for invalid claims."
  },
  {
    phase: "Phase 9",
    title: "Frontend dashboard",
    status: "Planned",
    description:
      "Wallet support, scanner workflows, and registry views for operators and agents."
  }
] as const;
