import type { Job, Queue } from "bull";
import { createEvmAdapter } from "@retrograde/evm-adapter";
import {
  buildEndpointScanResult,
  SCAN_ENDPOINT_JOB_NAME,
  ScanEndpointJobSchema,
  type ScanEndpointJob,
  type ScanJob,
} from "../jobs.js";
import type { ScanResult, ScanStatus } from "../schemas.js";

export interface EvmEndpointScanProcessorOptions {
  adapterFactory?: typeof createEvmAdapter;
}

/**
 * Processes one EVM endpoint scan payload into a canonical `ScanResult`.
 *
 * @param payload - Validated endpoint scan job payload.
 * @param options - Optional processor dependencies for tests and worker configuration.
 * @returns Canonical scan result for the target endpoint.
 */
export async function processEvmEndpointScan(
  payload: ScanEndpointJob,
  options: EvmEndpointScanProcessorOptions = {},
): Promise<ScanResult> {
  const adapterFactory = options.adapterFactory ?? createEvmAdapter;
  const adapter = adapterFactory({ chain: payload.chain });
  const scan = await adapter.scanEndpoint(payload.url, {
    samples: payload.samples,
    timeoutMs: payload.timeoutMs,
  });
  const status: ScanStatus = scan.health.status;

  return buildEndpointScanResult({
    chain: payload.chain,
    url: payload.url,
    status,
    latency: scan.latency,
    checkedAt: scan.health.checkedAt,
    metadata: {
      adapter: "evm",
      statusCode: scan.health.statusCode,
      error: scan.health.error,
      sampleCount: scan.samples.length,
    },
  });
}

/**
 * Registers the EVM endpoint scan processor on a Bull queue.
 *
 * @param queue - Scan queue returned by `createScanQueue`.
 * @param options - Optional processor dependencies for tests and worker configuration.
 * @returns Nothing.
 */
export function registerEvmEndpointScanProcessor(
  queue: Queue<ScanJob>,
  options: EvmEndpointScanProcessorOptions = {},
): void {
  queue.process(SCAN_ENDPOINT_JOB_NAME, async (job: Job<ScanJob>) => {
    const payload = ScanEndpointJobSchema.parse(job.data);
    return processEvmEndpointScan(payload, options);
  });
}
