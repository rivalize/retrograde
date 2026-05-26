import Bull, { type JobOptions, type Queue } from "bull";
import { z } from "zod";
import {
  SCAN_ENDPOINT_JOB_NAME,
  SCAN_QUEUE_NAME,
  ScanEndpointJobSchema,
  type ScanEndpointJob,
  type ScanJob,
} from "./jobs.js";

const RedisUrlSchema = z.string().url().default("redis://localhost:6379");

/**
 * Creates the Retrograde Bull scan queue.
 *
 * @param redisUrl - Redis connection URL.
 * @param queueName - Queue name to create.
 * @returns Configured Bull queue for scan jobs.
 */
export function createScanQueue(
  redisUrl = process.env.REDIS_URL,
  queueName = SCAN_QUEUE_NAME,
): Queue<ScanJob> {
  const parsedRedisUrl = RedisUrlSchema.parse(
    redisUrl ?? "redis://localhost:6379",
  );

  return new Bull<ScanJob>(queueName, parsedRedisUrl, {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1_000,
      },
      removeOnComplete: 1_000,
      removeOnFail: 5_000,
    },
  });
}

/**
 * Enqueues an endpoint scan job.
 *
 * @param queue - Bull queue returned by `createScanQueue`.
 * @param job - Endpoint scan payload.
 * @param options - Optional Bull job options.
 * @returns The Bull job created for the endpoint scan.
 */
export async function enqueueEndpointScan(
  queue: Queue<ScanJob>,
  job: Omit<ScanEndpointJob, "type">,
  options: JobOptions = {},
) {
  const payload = ScanEndpointJobSchema.parse({
    type: SCAN_ENDPOINT_JOB_NAME,
    ...job,
  });

  return queue.add(SCAN_ENDPOINT_JOB_NAME, payload, options);
}
