import { describe, expect, it } from "vitest";
import { calculateLatencyDistribution } from "../src/latency.js";

describe("calculateLatencyDistribution", () => {
  it("returns zeroes for empty samples", () => {
    expect(calculateLatencyDistribution([])).toEqual({
      p50: 0,
      p95: 0,
      p99: 0,
    });
  });

  it("calculates percentile values from sorted latency samples", () => {
    expect(calculateLatencyDistribution([50, 10, 20, 40, 30])).toEqual({
      p50: 30,
      p95: 50,
      p99: 50,
    });
  });
});
