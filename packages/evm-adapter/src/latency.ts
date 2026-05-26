import type { LatencyDistribution } from "./types.js";

/**
 * Calculates p50, p95, and p99 latency values from millisecond samples.
 *
 * @param samples - Latency samples in milliseconds.
 * @returns Latency distribution rounded to two decimal places.
 */
export function calculateLatencyDistribution(
  samples: readonly number[],
): LatencyDistribution {
  if (samples.length === 0) {
    return { p50: 0, p95: 0, p99: 0 };
  }

  const sorted = [...samples].sort((left, right) => left - right);

  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

function percentile(
  sortedSamples: readonly number[],
  percentileValue: number,
): number {
  const rawIndex =
    Math.ceil((percentileValue / 100) * sortedSamples.length) - 1;
  const boundedIndex = Math.min(
    Math.max(rawIndex, 0),
    sortedSamples.length - 1,
  );
  const value = sortedSamples[boundedIndex] ?? 0;

  return Math.round(value * 100) / 100;
}
