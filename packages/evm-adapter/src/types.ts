import type { Address, Chain, Hex } from "viem";

export type EvmChainId =
  | "ethereum"
  | "base"
  | "arbitrum"
  | "optimism"
  | "polygon"
  | "bnb"
  | "avalanche";

export type EndpointStatus = "healthy" | "degraded" | "down";

export interface EndpointHealth {
  url: string;
  status: EndpointStatus;
  statusCode?: number;
  latencyMs: number;
  checkedAt: Date;
  error?: string;
}

export interface LatencyDistribution {
  p50: number;
  p95: number;
  p99: number;
}

export interface EndpointScanResult {
  health: EndpointHealth;
  latency: LatencyDistribution;
  samples: EndpointHealth[];
}

export interface SimulationRequest {
  to?: Address;
  data?: Hex;
  value?: bigint;
  account?: Address;
}

export interface SimulationResult {
  success: boolean;
  returnData: Hex;
  gasUsed?: bigint;
  error?: string;
}

export interface RpcCallResult {
  data: Hex | undefined;
}

export interface RpcClient {
  getBytecode(args: { address: Address }): Promise<Hex | undefined>;
  getBlockNumber(): Promise<bigint>;
  call(args: SimulationRequest): Promise<RpcCallResult>;
}

export interface RpcProvider {
  name: string;
  url: string;
  client: RpcClient;
}

export interface EvmChainConfig {
  id: EvmChainId;
  chainId: number;
  viemChain: Chain;
  alchemyNetwork?: string;
  infuraNetwork?: string;
  publicRpcUrl: string;
}
