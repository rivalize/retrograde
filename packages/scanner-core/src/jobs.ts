import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  EvmChainIdSchema,
  LatencyDistributionSchema,
  type EvmChainId,
  type LatencyDistribution,
  type ScanResult,
  type ScanStatus,
} from "./schemas.js";

export const SCAN_QUEUE_NAME = "retrograde:scan";
export const SCAN_ENDPOINT_JOB_NAME = "scan:endpoint";

export const ScanEndpointJobSchema = z.object({
  type: z.literal(SCAN_ENDPOINT_JOB_NAME),
  chain: EvmChainIdSchema,
  url: z.string().url(),
  samples: z.number().int().min(1).max(25).default(5),
  timeoutMs: z.number().int().min(250).max(60_000).default(5_000),
});

export type ScanEndpointJob = z.infer<typeof ScanEndpointJobSchema>;
export type ScanJob = ScanEndpointJob;

export interface EndpointScanNormalizationInput {
  chain: EvmChainId;
  url: string;
  status: ScanStatus;
  latency: LatencyDistribution;
  checkedAt: Date;
  metadata: Record<string, unknown>;
}

/**
 * Parses and validates a raw Bull scan job payload.
 *
 * @param value - Raw job payload from the queue.
 * @returns A validated scan job payload.
 */
export function parseScanJob(value: unknown): ScanJob {
  return ScanEndpointJobSchema.parse(value);
}

/**
 * Builds a canonical endpoint `ScanResult`.
 *
 * @param input - Normalized endpoint scan data from a chain adapter.
 * @returns Canonical `ScanResult` for persistence and downstream consumers.
 */
export function buildEndpointScanResult(
  input: EndpointScanNormalizationInput,
): ScanResult {
  return {
    id: randomUUID(),
    chain: input.chain,
    target: input.url,
    targetType: "endpoint",
    status: input.status,
    latency: LatencyDistributionSchema.parse(input.latency),
    vulnerabilities: [],
    checkedAt: input.checkedAt,
    metadata: input.metadata,
  };
}
