import {
  arbitrum,
  avalanche,
  base,
  bsc,
  mainnet,
  optimism,
  polygon,
} from "viem/chains";
import type { EvmChainConfig, EvmChainId } from "./types.js";

export const EVM_CHAIN_CONFIGS: Record<EvmChainId, EvmChainConfig> = {
  ethereum: {
    id: "ethereum",
    chainId: 1,
    viemChain: mainnet,
    alchemyNetwork: "eth-mainnet",
    infuraNetwork: "mainnet",
    publicRpcUrl: "https://ethereum.publicnode.com",
  },
  base: {
    id: "base",
    chainId: 8453,
    viemChain: base,
    alchemyNetwork: "base-mainnet",
    infuraNetwork: "base-mainnet",
    publicRpcUrl: "https://base.publicnode.com",
  },
  arbitrum: {
    id: "arbitrum",
    chainId: 42161,
    viemChain: arbitrum,
    alchemyNetwork: "arb-mainnet",
    infuraNetwork: "arbitrum-mainnet",
    publicRpcUrl: "https://arbitrum-one.publicnode.com",
  },
  optimism: {
    id: "optimism",
    chainId: 10,
    viemChain: optimism,
    alchemyNetwork: "opt-mainnet",
    infuraNetwork: "optimism-mainnet",
    publicRpcUrl: "https://optimism.publicnode.com",
  },
  polygon: {
    id: "polygon",
    chainId: 137,
    viemChain: polygon,
    alchemyNetwork: "polygon-mainnet",
    infuraNetwork: "polygon-mainnet",
    publicRpcUrl: "https://polygon-bor-rpc.publicnode.com",
  },
  bnb: {
    id: "bnb",
    chainId: 56,
    viemChain: bsc,
    publicRpcUrl: "https://bsc-rpc.publicnode.com",
  },
  avalanche: {
    id: "avalanche",
    chainId: 43114,
    viemChain: avalanche,
    publicRpcUrl: "https://avalanche-c-chain-rpc.publicnode.com",
  },
};

/**
 * Looks up static configuration for a supported EVM chain.
 *
 * @param chain - Retrograde EVM chain id.
 * @returns Static EVM chain configuration.
 */
export function getEvmChainConfig(chain: EvmChainId): EvmChainConfig {
  return EVM_CHAIN_CONFIGS[chain];
}
