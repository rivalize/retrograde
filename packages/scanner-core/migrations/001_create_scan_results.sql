CREATE TABLE IF NOT EXISTS scan_results (
  id UUID PRIMARY KEY,
  chain TEXT NOT NULL,
  target TEXT NOT NULL,
  target_type TEXT NOT NULL,
  status TEXT NOT NULL,
  latency JSONB NOT NULL DEFAULT '{"p50":0,"p95":0,"p99":0}'::jsonb,
  vulnerabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT scan_results_chain_check CHECK (
    chain IN ('ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bnb', 'avalanche', 'solana')
  ),
  CONSTRAINT scan_results_target_type_check CHECK (target_type IN ('endpoint', 'contract', 'repo')),
  CONSTRAINT scan_results_status_check CHECK (status IN ('healthy', 'degraded', 'down', 'vulnerable'))
);

CREATE INDEX IF NOT EXISTS scan_results_chain_target_checked_at_idx
  ON scan_results (chain, target, checked_at DESC);

CREATE INDEX IF NOT EXISTS scan_results_status_checked_at_idx
  ON scan_results (status, checked_at DESC);
