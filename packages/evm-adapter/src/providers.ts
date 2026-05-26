import { createPublicClient, http } from "viem";
import { z } from "zod";
import { getEvmChainConfig } from "./chains.js";
import type { EvmChainConfig, EvmChainId, RpcProvider } from "./types.js";

const OptionalEnvStringSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const ProviderEnvSchema = z
  .object({
    ALCHEMY_API_KEY: OptionalEnvStringSchema,
    INFURA_API_KEY: OptionalEnvStringSchema,
    CHAINSTACK_EVM_URL: OptionalEnvStringSchema,
  })
  .passthrough();

export interface ProviderDescriptor {
  name: string;
  url: string;
}

/**
 * Creates RPC provider descriptors for an EVM chain in failover order.
 *
 * @param chain - Retrograde EVM chain id.
 * @param env - Environment values containing RPC credentials.
 * @returns Ordered provider descriptors.
 */
export function createProviderDescriptors(
  chain: EvmChainId,
  env: NodeJS.ProcessEnv = process.env,
): ProviderDescriptor[] {
  const parsedEnv = ProviderEnvSchema.parse(env);
  const config = getEvmChainConfig(chain);
  const descriptors: ProviderDescriptor[] = [];

  if (config.alchemyNetwork && parsedEnv.ALCHEMY_API_KEY) {
    descriptors.push({
      name: "alchemy",
      url: `https://${config.alchemyNetwork}.g.alchemy.com/v2/${parsedEnv.ALCHEMY_API_KEY}`,
    });
  }

  if (config.infuraNetwork && parsedEnv.INFURA_API_KEY) {
    descriptors.push({
      name: "infura",
      url: `https://${config.infuraNetwork}.infura.io/v3/${parsedEnv.INFURA_API_KEY}`,
    });
  }

  if (parsedEnv.CHAINSTACK_EVM_URL && shouldUseChainstack(chain)) {
    descriptors.push({
      name: "chainstack",
      url: formatChainstackUrl(parsedEnv.CHAINSTACK_EVM_URL, config),
    });
  }

  descriptors.push({
    name: "public",
    url: config.publicRpcUrl,
  });

  return descriptors;
}

/**
 * Creates viem-backed RPC providers for an EVM chain.
 *
 * @param chain - Retrograde EVM chain id.
 * @param env - Environment values containing RPC credentials.
 * @returns Ordered viem RPC providers.
 */
export function createRpcProviders(
  chain: EvmChainId,
  env: NodeJS.ProcessEnv = process.env,
): RpcProvider[] {
  const config = getEvmChainConfig(chain);

  return createProviderDescriptors(chain, env).map((descriptor) => ({
    ...descriptor,
    client: createPublicClient({
      chain: config.viemChain,
      transport: http(descriptor.url),
    }),
  }));
}

function shouldUseChainstack(chain: EvmChainId): boolean {
  return chain === "polygon" || chain === "bnb" || chain === "avalanche";
}

function formatChainstackUrl(
  urlTemplate: string,
  config: EvmChainConfig,
): string {
  return urlTemplate
    .replaceAll("{chain}", config.id)
    .replaceAll("{chainId}", String(config.chainId));
}
