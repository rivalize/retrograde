import pino, { type Logger } from "pino";
import { isAddress, type Address, type Hex } from "viem";
import {
  InvalidAddressError,
  AdapterFeatureUnavailableError,
  toErrorMessage,
} from "./errors.js";
import { withProviderFailover } from "./failover.js";
import { calculateLatencyDistribution } from "./latency.js";
import { createRpcProviders } from "./providers.js";
import type {
  EndpointHealth,
  EndpointScanResult,
  EvmChainId,
  LatencyDistribution,
  RpcProvider,
  SimulationRequest,
  SimulationResult,
} from "./types.js";

export interface EndpointScanOptions {
  samples?: number;
  timeoutMs?: number;
}

export interface EvmAdapterOptions {
  chain: EvmChainId;
  providers?: RpcProvider[];
  fetchFn?: typeof fetch;
  logger?: Logger;
}

export class EvmAdapter {
  private readonly chain: EvmChainId;
  private readonly providers: readonly RpcProvider[];
  private readonly fetchFn: typeof fetch;
  private readonly logger: Logger;

  /**
   * Creates an EVM adapter for a supported chain.
   *
   * @param options - Chain, provider, fetch, and logging options.
   * @returns EVM adapter instance.
   */
  constructor(options: EvmAdapterOptions) {
    this.chain = options.chain;
    this.providers = options.providers ?? createRpcProviders(options.chain);
    this.fetchFn = options.fetchFn ?? fetch;
    this.logger =
      options.logger ??
      pino({
        name: `evm-adapter:${options.chain}`,
        level: process.env.LOG_LEVEL ?? "info",
      });
  }

  /**
   * Checks endpoint health using a latency-distribution scan.
   *
   * @param url - Endpoint URL to check.
   * @returns Endpoint health with `latencyMs` set to measured p50 latency.
   */
  async checkEndpoint(url: string): Promise<EndpointHealth> {
    const scan = await this.scanEndpoint(url);

    return {
      ...scan.health,
      latencyMs: scan.latency.p50,
    };
  }

  /**
   * Checks endpoint health over multiple samples and returns latency percentiles.
   *
   * @param url - Endpoint URL to check.
   * @param options - Optional sample count and request timeout.
   * @returns Endpoint health, latency distribution, and raw samples.
   */
  async scanEndpoint(
    url: string,
    options: EndpointScanOptions = {},
  ): Promise<EndpointScanResult> {
    const parsedUrl = new URL(url).toString();
    const samples = Math.max(1, Math.min(options.samples ?? 5, 25));
    const timeoutMs = options.timeoutMs ?? 5_000;
    const results: EndpointHealth[] = [];

    for (let sampleIndex = 0; sampleIndex < samples; sampleIndex += 1) {
      results.push(await this.checkEndpointOnce(parsedUrl, timeoutMs));
    }

    const latency = calculateLatencyDistribution(
      results.map((sample) => sample.latencyMs),
    );
    const health = this.aggregateEndpointHealth(parsedUrl, results, latency);

    return {
      health,
      latency,
      samples: results,
    };
  }

  /**
   * Reads deployed bytecode for a contract address.
   *
   * @param address - EVM contract address.
   * @returns Hex bytecode, or `0x` when no code is deployed at the address.
   */
  async getContractBytecode(address: string): Promise<string> {
    const validatedAddress = this.parseAddress(address);

    return withProviderFailover(
      this.providers,
      "getContractBytecode",
      async (provider) => {
        const bytecode = await provider.client.getBytecode({
          address: validatedAddress,
        });
        return bytecode ?? "0x";
      },
      { logger: this.logger },
    );
  }

  /**
   * Retrieves the latest block number for chain liveness checks.
   *
   * @returns Latest block number as a JavaScript number.
   */
  async getBlockNumber(): Promise<number> {
    const blockNumber = await withProviderFailover(
      this.providers,
      "getBlockNumber",
      async (provider) => provider.client.getBlockNumber(),
      { logger: this.logger },
    );

    return Number(blockNumber);
  }

  /**
   * Simulates a transaction through `eth_call`.
   *
   * @param tx - Transaction request to simulate.
   * @returns Simulation status and return data.
   */
  async simulateTransaction(tx: SimulationRequest): Promise<SimulationResult> {
    try {
      const result = await withProviderFailover(
        this.providers,
        "simulateTransaction",
        async (provider) => provider.client.call(tx),
        { logger: this.logger },
      );

      return {
        success: true,
        returnData: result.data ?? "0x",
      };
    } catch (error) {
      return {
        success: false,
        returnData: "0x",
        error: toErrorMessage(error),
      };
    }
  }

  /**
   * Gets a contract ABI when explorer integration is available.
   *
   * @param address - EVM contract address.
   * @returns Contract ABI entries.
   */
  async getContractABI(address: string): Promise<unknown[]> {
    this.parseAddress(address);
    throw new AdapterFeatureUnavailableError("Contract ABI retrieval");
  }

  private parseAddress(address: string): Address {
    if (!isAddress(address)) {
      throw new InvalidAddressError(address);
    }

    return address;
  }

  private async checkEndpointOnce(
    url: string,
    timeoutMs: number,
  ): Promise<EndpointHealth> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    const startedAt = performance.now();

    try {
      const response = await this.fetchFn(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          accept: "application/json,text/plain,*/*",
        },
      });
      const latencyMs = performance.now() - startedAt;
      const status = endpointStatusFromHttpStatus(response.status);

      return {
        url,
        status,
        statusCode: response.status,
        latencyMs,
        checkedAt: new Date(),
      };
    } catch (error) {
      return {
        url,
        status: "down",
        latencyMs: performance.now() - startedAt,
        checkedAt: new Date(),
        error: toErrorMessage(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private aggregateEndpointHealth(
    url: string,
    samples: readonly EndpointHealth[],
    latency: LatencyDistribution,
  ): EndpointHealth {
    const latest = samples[samples.length - 1];
    const status = aggregateEndpointStatus(samples);
    const base = {
      url,
      status,
      latencyMs: latency.p50,
      checkedAt: latest?.checkedAt ?? new Date(),
    };

    return {
      ...base,
      ...(latest?.statusCode ? { statusCode: latest.statusCode } : {}),
      ...(latest?.error ? { error: latest.error } : {}),
    };
  }
}

/**
 * Creates a configured EVM adapter.
 *
 * @param options - Chain, provider, fetch, and logging options.
 * @returns Configured EVM adapter.
 */
export function createEvmAdapter(options: EvmAdapterOptions): EvmAdapter {
  return new EvmAdapter(options);
}

function endpointStatusFromHttpStatus(
  statusCode: number,
): EndpointHealth["status"] {
  if (statusCode >= 500) {
    return "degraded";
  }

  return "healthy";
}

function aggregateEndpointStatus(
  samples: readonly EndpointHealth[],
): EndpointHealth["status"] {
  if (samples.every((sample) => sample.status === "down")) {
    return "down";
  }

  if (samples.some((sample) => sample.status !== "healthy")) {
    return "degraded";
  }

  return "healthy";
}
