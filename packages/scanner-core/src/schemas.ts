import { z } from "zod";

export const ChainIdSchema = z.enum([
  "ethereum",
  "base",
  "arbitrum",
  "optimism",
  "polygon",
  "bnb",
  "avalanche",
  "solana",
]);

export const EvmChainIdSchema = ChainIdSchema.exclude(["solana"]);

export const TargetTypeSchema = z.enum(["endpoint", "contract", "repo"]);
export const ScanStatusSchema = z.enum([
  "healthy",
  "degraded",
  "down",
  "vulnerable",
]);
export const EndpointStatusSchema = z.enum(["healthy", "degraded", "down"]);
export const VulnerabilitySeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const LatencyDistributionSchema = z.object({
  p50: z.number().nonnegative(),
  p95: z.number().nonnegative(),
  p99: z.number().nonnegative(),
});

export const VulnerabilitySchema = z.object({
  id: z.string().min(1),
  severity: VulnerabilitySeveritySchema,
  type: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1).optional(),
});

export const EndpointHealthSchema = z.object({
  url: z.string().url(),
  status: EndpointStatusSchema,
  statusCode: z.number().int().min(100).max(599).optional(),
  latencyMs: z.number().nonnegative(),
  checkedAt: z.coerce.date(),
  error: z.string().min(1).optional(),
});

export const ScanResultSchema = z.object({
  id: z.string().uuid(),
  chain: ChainIdSchema,
  target: z.string().min(1),
  targetType: TargetTypeSchema,
  status: ScanStatusSchema,
  latency: LatencyDistributionSchema,
  vulnerabilities: z.array(VulnerabilitySchema),
  checkedAt: z.coerce.date(),
  metadata: z.record(z.unknown()),
});

export type ChainId = z.infer<typeof ChainIdSchema>;
export type EvmChainId = z.infer<typeof EvmChainIdSchema>;
export type TargetType = z.infer<typeof TargetTypeSchema>;
export type ScanStatus = z.infer<typeof ScanStatusSchema>;
export type EndpointStatus = z.infer<typeof EndpointStatusSchema>;
export type VulnerabilitySeverity = z.infer<typeof VulnerabilitySeveritySchema>;
export type LatencyDistribution = z.infer<typeof LatencyDistributionSchema>;
export type Vulnerability = z.infer<typeof VulnerabilitySchema>;
export type EndpointHealth = z.infer<typeof EndpointHealthSchema>;
export type ScanResult = z.infer<typeof ScanResultSchema>;
