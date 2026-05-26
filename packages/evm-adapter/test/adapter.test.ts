import pino from "pino";
import { describe, expect, it, vi } from "vitest";
import { EvmAdapter } from "../src/adapter.js";
import {
  AdapterFeatureUnavailableError,
  InvalidAddressError,
  ProviderFailoverError,
} from "../src/errors.js";
import type { RpcClient, RpcProvider } from "../src/types.js";

const logger = pino({ level: "silent" });

function createClient(overrides: Partial<RpcClient>): RpcClient {
  return {
    async getBytecode() {
      return "0x";
    },
    async getBlockNumber() {
      return 1n;
    },
    async call() {
      return { data: "0x" };
    },
    ...overrides,
  };
}

function createProvider(name: string, client: RpcClient): RpcProvider {
  return {
    name,
    url: `https://${name}.example`,
    client,
  };
}

describe("EvmAdapter", () => {
  it("measures endpoint health with p50, p95, and p99 latency", async () => {
    const fetchFn = vi.fn<typeof fetch>(
      async () => new Response("payment required", { status: 402 }),
    );
    const adapter = new EvmAdapter({
      chain: "ethereum",
      fetchFn,
      providers: [],
      logger,
    });

    const result = await adapter.scanEndpoint("https://api.example/scan", {
      samples: 3,
      timeoutMs: 1_000,
    });

    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(result.health.status).toBe("healthy");
    expect(result.latency.p50).toBeGreaterThanOrEqual(0);
    expect(result.latency.p95).toBeGreaterThanOrEqual(result.latency.p50);
    expect(result.latency.p99).toBeGreaterThanOrEqual(result.latency.p50);
    expect(result.samples).toHaveLength(3);
  });

  it("marks endpoint scans degraded when any sample has a server error", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("ok", { status: 200 }))
      .mockResolvedValueOnce(new Response("error", { status: 503 }));
    const adapter = new EvmAdapter({
      chain: "base",
      fetchFn,
      providers: [],
      logger,
    });

    const result = await adapter.scanEndpoint("https://api.example/scan", {
      samples: 2,
    });

    expect(result.health.status).toBe("degraded");
    expect(result.health.statusCode).toBe(503);
  });

  it("marks endpoint scans down when every sample fails", async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => {
      throw new Error("connection refused");
    });
    const adapter = new EvmAdapter({
      chain: "ethereum",
      fetchFn,
      providers: [],
      logger,
    });

    const result = await adapter.scanEndpoint("https://api.example/scan", {
      samples: 2,
    });

    expect(result.health.status).toBe("down");
    expect(result.health.error).toBe("connection refused");
  });

  it("sets checkEndpoint latency to the measured p50", async () => {
    const fetchFn = vi.fn<typeof fetch>(
      async () => new Response("ok", { status: 200 }),
    );
    const adapter = new EvmAdapter({
      chain: "ethereum",
      fetchFn,
      providers: [],
      logger,
    });

    const health = await adapter.checkEndpoint("https://api.example/scan");

    expect(health.status).toBe("healthy");
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("fails over between providers for block liveness", async () => {
    const primary = createProvider(
      "alchemy",
      createClient({
        async getBlockNumber() {
          throw new Error("rate limited");
        },
      }),
    );
    const fallback = createProvider(
      "infura",
      createClient({
        async getBlockNumber() {
          return 123n;
        },
      }),
    );
    const adapter = new EvmAdapter({
      chain: "arbitrum",
      providers: [primary, fallback],
      logger,
    });

    await expect(adapter.getBlockNumber()).resolves.toBe(123);
  });

  it("throws a typed failover error when every provider fails", async () => {
    const provider = createProvider(
      "public",
      createClient({
        async getBlockNumber() {
          throw new Error("unavailable");
        },
      }),
    );
    const adapter = new EvmAdapter({
      chain: "optimism",
      providers: [provider],
      logger,
    });

    await expect(adapter.getBlockNumber()).rejects.toBeInstanceOf(
      ProviderFailoverError,
    );
  });

  it("validates addresses before bytecode reads", async () => {
    const adapter = new EvmAdapter({
      chain: "ethereum",
      providers: [],
      logger,
    });

    await expect(
      adapter.getContractBytecode("not-an-address"),
    ).rejects.toBeInstanceOf(InvalidAddressError);
  });

  it("reads bytecode from the first healthy provider", async () => {
    const provider = createProvider(
      "alchemy",
      createClient({
        async getBytecode() {
          return "0x60016000";
        },
      }),
    );
    const adapter = new EvmAdapter({
      chain: "ethereum",
      providers: [provider],
      logger,
    });

    await expect(
      adapter.getContractBytecode("0x0000000000000000000000000000000000000001"),
    ).resolves.toBe("0x60016000");
  });

  it("normalizes empty bytecode responses to 0x", async () => {
    const provider = createProvider(
      "public",
      createClient({
        async getBytecode() {
          return undefined;
        },
      }),
    );
    const adapter = new EvmAdapter({
      chain: "ethereum",
      providers: [provider],
      logger,
    });

    await expect(
      adapter.getContractBytecode("0x0000000000000000000000000000000000000001"),
    ).resolves.toBe("0x");
  });

  it("simulates successful transactions through eth_call", async () => {
    const provider = createProvider(
      "alchemy",
      createClient({
        async call() {
          return { data: "0x1234" };
        },
      }),
    );
    const adapter = new EvmAdapter({
      chain: "ethereum",
      providers: [provider],
      logger,
    });

    await expect(
      adapter.simulateTransaction({
        to: "0x0000000000000000000000000000000000000001",
      }),
    ).resolves.toEqual({
      success: true,
      returnData: "0x1234",
    });
  });

  it("returns typed simulation failures", async () => {
    const provider = createProvider(
      "public",
      createClient({
        async call() {
          throw new Error("execution reverted");
        },
      }),
    );
    const adapter = new EvmAdapter({
      chain: "ethereum",
      providers: [provider],
      logger,
    });

    const result = await adapter.simulateTransaction({
      to: "0x0000000000000000000000000000000000000001",
    });

    expect(result.success).toBe(false);
    expect(result.returnData).toBe("0x");
    expect(result.error).toContain("All EVM providers failed");
  });

  it("fails fast for ABI retrieval until explorer integration exists", async () => {
    const adapter = new EvmAdapter({
      chain: "ethereum",
      providers: [],
      logger,
    });

    await expect(
      adapter.getContractABI("0x0000000000000000000000000000000000000001"),
    ).rejects.toBeInstanceOf(AdapterFeatureUnavailableError);
  });
});
