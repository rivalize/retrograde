import { describe, expect, it } from "vitest";
import { ScanResultSchema } from "../src/schemas.js";

describe("ScanResultSchema", () => {
  it("coerces checkedAt values into Date objects", () => {
    const result = ScanResultSchema.parse({
      id: "00000000-0000-4000-8000-000000000000",
      chain: "ethereum",
      target: "https://api.example/scan",
      targetType: "endpoint",
      status: "healthy",
      latency: {
        p50: 10,
        p95: 20,
        p99: 30,
      },
      vulnerabilities: [],
      checkedAt: "2026-05-26T00:00:00.000Z",
      metadata: {},
    });

    expect(result.checkedAt).toBeInstanceOf(Date);
  });
});
