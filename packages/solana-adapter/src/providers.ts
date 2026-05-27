import { Connection, type GetProgramAccountsConfig } from "@solana/web3.js";
import * as YellowstoneGrpc from "@triton-one/yellowstone-grpc";
import { z } from "zod";
import type {
  SolanaConnection,
  SolanaRawAccountInfo,
  SolanaRawProgramAccount,
  SolanaRpcProvider,
  YellowstoneClient,
  YellowstoneConfig,
} from "./types.js";

const OptionalEnvStringSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const ProviderEnvSchema = z
  .object({
    HELIUS_API_KEY: OptionalEnvStringSchema,
    HELIUS_GEYSER_URL: OptionalEnvStringSchema,
    CHAINSTACK_SOLANA_URL: OptionalEnvStringSchema,
  })
  .passthrough();

export interface SolanaProviderDescriptor {
  name: string;
  url: string;
}

/**
 * Creates Solana JSON-RPC provider descriptors in failover order.
 *
 * @param env - Environment values containing Solana RPC credentials.
 * @returns Ordered Solana provider descriptors.
 */
export function createSolanaProviderDescriptors(
  env: NodeJS.ProcessEnv = process.env,
): SolanaProviderDescriptor[] {
  const parsedEnv = ProviderEnvSchema.parse(env);
  const descriptors: SolanaProviderDescriptor[] = [];

  if (parsedEnv.HELIUS_API_KEY) {
    descriptors.push({
      name: "helius",
      url: `https://mainnet.helius-rpc.com/?api-key=${parsedEnv.HELIUS_API_KEY}`,
    });
  }

  if (parsedEnv.CHAINSTACK_SOLANA_URL) {
    descriptors.push({
      name: "chainstack",
      url: parsedEnv.CHAINSTACK_SOLANA_URL,
    });
  }

  descriptors.push({
    name: "public",
    url: "https://api.mainnet-beta.solana.com",
  });

  return descriptors;
}

/**
 * Creates web3.js Solana RPC providers.
 *
 * @param env - Environment values containing Solana RPC credentials.
 * @returns Ordered Solana RPC providers.
 */
export function createSolanaRpcProviders(
  env: NodeJS.ProcessEnv = process.env,
): SolanaRpcProvider[] {
  return createSolanaProviderDescriptors(env).map((descriptor) => ({
    ...descriptor,
    connection: createSolanaConnection(descriptor.url),
  }));
}

/**
 * Reads Yellowstone Geyser configuration from environment values.
 *
 * @param env - Environment values containing Yellowstone endpoint and token.
 * @returns Yellowstone config when available; otherwise `undefined`.
 */
export function createYellowstoneConfig(
  env: NodeJS.ProcessEnv = process.env,
): YellowstoneConfig | undefined {
  const parsedEnv = ProviderEnvSchema.parse(env);

  if (!parsedEnv.HELIUS_GEYSER_URL || !parsedEnv.HELIUS_API_KEY) {
    return undefined;
  }

  return {
    endpoint: parsedEnv.HELIUS_GEYSER_URL,
    token: parsedEnv.HELIUS_API_KEY,
  };
}

/**
 * Creates a Yellowstone gRPC client.
 *
 * @param config - Yellowstone endpoint and auth token.
 * @returns Yellowstone client.
 */
export function createYellowstoneClient(
  config: YellowstoneConfig,
): YellowstoneClient {
  type YellowstoneClientConstructor = new (
    endpoint: string,
    token: string | undefined,
    channelOptions: Record<string, unknown>,
  ) => YellowstoneClient;
  const YellowstoneClientConstructor =
    YellowstoneGrpc.default as unknown as YellowstoneClientConstructor;

  return new YellowstoneClientConstructor(config.endpoint, config.token, {
    "grpc.max_receive_message_length": 64 * 1024 * 1024,
  });
}

function createSolanaConnection(url: string): SolanaConnection {
  const connection = new Connection(url, "confirmed");

  return {
    async getAccountInfo(
      pubkey,
      commitment,
    ): Promise<SolanaRawAccountInfo | null> {
      return connection.getAccountInfo(pubkey, commitment);
    },
    async getProgramAccounts(
      pubkey,
      config?: GetProgramAccountsConfig,
    ): Promise<SolanaRawProgramAccount[]> {
      return Array.from(await connection.getProgramAccounts(pubkey, config));
    },
    async getSlot(commitment): Promise<number> {
      return connection.getSlot(
        commitment === "confirmed" ? "confirmed" : undefined,
      );
    },
    onAccountChange(pubkey, callback, commitment): number {
      return connection.onAccountChange(pubkey, callback, commitment);
    },
    async removeAccountChangeListener(subscriptionId): Promise<void> {
      await connection.removeAccountChangeListener(subscriptionId);
    },
  };
}
