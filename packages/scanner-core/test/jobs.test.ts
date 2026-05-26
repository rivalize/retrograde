import { describe, expect, it } from "vitest";
import { buildEndpointScanResult, parseScanJob } from "../src/jobs.js";

describe("scanner-core jobs", () => {
  it("parses endpoint scan jobs with defaults", () => {
    const payload = parseScanJob({
      type: "scan:endpoint",
      chain: "ethereum",
      url: "https://api.example/scan",
    });

    expect(payload).toEqual({
      type: "scan:endpoint",
      chain: "ethereum",
      url: "https://api.example/scan",
      samples: 5,
      timeoutMs: 5_000,
    });
  });

  it("normalizes endpoint scans into canonical ScanResult records", () => {
    const checkedAt = new Date("2026-05-26T00:00:00.000Z");
    const result = buildEndpointScanResult({
      chain: "base",
      url: "https://api.example/scan",
      status: "healthy",
      latency: {
        p50: 10,
        p95: 20,
        p99: 30,
      },
      checkedAt,
      metadata: {
        adapter: "evm",
      },
    });

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result).toMatchObject({
      chain: "base",
      target: "https://api.example/scan",
      targetType: "endpoint",
      status: "healthy",
      vulnerabilities: [],
      checkedAt,
      metadata: {
        adapter: "evm",
      },
    });
  });
});
