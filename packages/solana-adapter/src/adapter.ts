import pino, { type Logger } from "pino";
import { PublicKey } from "@solana/web3.js";
import { InvalidPublicKeyError, toErrorMessage } from "./errors.js";
import { withSolanaProviderFailover } from "./failover.js";
import {
  createSolanaRpcProviders,
  createYellowstoneClient,
  createYellowstoneConfig,
} from "./providers.js";
import {
  AccountUpdateSchema,
  ProgramAccountSchema,
  SolanaAccountInfoSchema,
} from "./schemas.js";
import { subscribeYellowstoneAccountUpdates } from "./yellowstone.js";
import type {
  AccountUpdate,
  EndpointHealth,
  ProgramAccount,
  SolanaAccountInfo,
  SolanaRawAccountInfo,
  SolanaRawProgramAccount,
  SolanaRpcProvider,
  YellowstoneClient,
  YellowstoneConfig,
} from "./types.js";

export interface SolanaAdapterOptions {
  providers?: SolanaRpcProvider[];
  fetchFn?: typeof fetch;
  logger?: Logger;
  yellowstoneConfig?: YellowstoneConfig;
  yellowstoneClientFactory?: (config: YellowstoneConfig) => YellowstoneClient;
}

export class SolanaAdapter {
  private readonly providers: readonly SolanaRpcProvider[];
  private readonly fetchFn: typeof fetch;
  private readonly logger: Logger;
  private readonly yellowstoneConfig: YellowstoneConfig | undefined;
  private readonly yellowstoneClientFactory: (
    config: YellowstoneConfig,
  ) => YellowstoneClient;

  /**
   * Creates a Solana adapter with JSON-RPC failover and optional Yellowstone support.
   *
   * @param options - Provider, fetch, logging, and Yellowstone configuration.
   * @returns Solana adapter instance.
   */
  constructor(options: SolanaAdapterOptions = {}) {
    this.providers = options.providers ?? createSolanaRpcProviders();
    this.fetchFn = options.fetchFn ?? fetch;
    this.logger =
      options.logger ??
      pino({
        name: "solana-adapter",
        level: process.env.LOG_LEVEL ?? "info",
      });
    this.yellowstoneConfig =
      options.yellowstoneConfig ?? createYellowstoneConfig();
    this.yellowstoneClientFactory =
      options.yellowstoneClientFactory ?? createYellowstoneClient;
  }

  /**
   * Checks endpoint health with an HTTP GET request.
   *
   * @param url - Endpoint URL to check.
   * @returns Endpoint health and observed latency.
   */
  async checkEndpoint(url: string): Promise<EndpointHealth> {
    const parsedUrl = new URL(url).toString();
    const startedAt = performance.now();

    try {
      const response = await this.fetchFn(parsedUrl, {
        method: "GET",
        headers: {
          accept: "application/json,text/plain,*/*",
        },
      });
      const latencyMs = performance.now() - startedAt;

      return {
        url: parsedUrl,
        status: endpointStatusFromHttpStatus(response.status),
        statusCode: response.status,
        latencyMs,
        checkedAt: new Date(),
      };
    } catch (error) {
      return {
        url: parsedUrl,
        status: "down",
        latencyMs: performance.now() - startedAt,
        checkedAt: new Date(),
        error: toErrorMessage(error),
      };
    }
  }

  /**
   * Reads a Solana account and normalizes its data.
   *
   * @param pubkey - Account public key.
   * @returns Normalized account info, or `null` when the account does not exist.
   */
  async getAccountInfo(pubkey: string): Promise<SolanaAccountInfo | null> {
    const publicKey = this.parsePublicKey(pubkey);
    const accountInfo = await withSolanaProviderFailover(
      this.providers,
      "getAccountInfo",
      async (provider) =>
        provider.connection.getAccountInfo(publicKey, "confirmed"),
      { logger: this.logger },
    );

    if (!accountInfo) {
      return null;
    }

    return normalizeAccountInfo(publicKey, accountInfo);
  }

  /**
   * Reads Solana program accounts and normalizes account data.
   *
   * @param programId - Program public key.
   * @returns Normalized program account records.
   */
  async getProgramAccounts(programId: string): Promise<ProgramAccount[]> {
    const publicKey = this.parsePublicKey(programId);
    const accounts = await withSolanaProviderFailover(
      this.providers,
      "getProgramAccounts",
      async (provider) =>
        provider.connection.getProgramAccounts(publicKey, {
          commitment: "confirmed",
        }),
      { logger: this.logger },
    );

    return accounts.map((programAccount) =>
      normalizeProgramAccount(programAccount),
    );
  }

  /**
   * Subscribes to account updates through Yellowstone when configured, otherwise Solana websocket.
   *
   * @param pubkey - Account public key to watch.
   * @param cb - Callback invoked with normalized account updates.
   * @returns Function that closes the subscription.
   */
  subscribeAccountUpdates(
    pubkey: string,
    cb: (update: AccountUpdate) => void,
  ): () => void {
    const publicKey = this.parsePublicKey(pubkey);

    if (this.yellowstoneConfig) {
      const client = this.yellowstoneClientFactory(this.yellowstoneConfig);

      return subscribeYellowstoneAccountUpdates({
        client,
        pubkey: publicKey,
        onUpdate: cb,
      });
    }

    const provider = this.providers[0];

    if (!provider) {
      return () => undefined;
    }

    const subscriptionId = provider.connection.onAccountChange(
      publicKey,
      (accountInfo, context) => {
        const normalized = normalizeAccountInfo(publicKey, accountInfo);
        cb(
          AccountUpdateSchema.parse({
            pubkey: normalized.pubkey,
            lamports: normalized.lamports,
            owner: normalized.owner,
            executable: normalized.executable,
            rentEpoch: normalized.rentEpoch,
            dataBase64: normalized.dataBase64,
            slot: context.slot,
            source: "websocket",
            receivedAt: new Date(),
          }),
        );
      },
      "confirmed",
    );

    return () => {
      void provider.connection
        .removeAccountChangeListener(subscriptionId)
        .catch((error) => {
          this.logger.warn(
            { error: toErrorMessage(error), subscriptionId },
            "failed to remove Solana account listener",
          );
        });
    };
  }

  /**
   * Retrieves the current Solana slot for liveness checks.
   *
   * @returns Latest confirmed slot.
   */
  async getSlot(): Promise<number> {
    return withSolanaProviderFailover(
      this.providers,
      "getSlot",
      async (provider) => provider.connection.getSlot("confirmed"),
      { logger: this.logger },
    );
  }

  /**
   * Measures JSON-RPC latency by timing a confirmed slot lookup.
   *
   * @returns Slot lookup latency in milliseconds.
   */
  async getLatency(): Promise<number> {
    const startedAt = performance.now();
    await this.getSlot();

    return Math.round((performance.now() - startedAt) * 100) / 100;
  }

  private parsePublicKey(pubkey: string): PublicKey {
    try {
      return new PublicKey(pubkey);
    } catch {
      throw new InvalidPublicKeyError(pubkey);
    }
  }
}

/**
 * Creates a configured Solana adapter.
 *
 * @param options - Provider, fetch, logging, and Yellowstone configuration.
 * @returns Configured Solana adapter.
 */
export function createSolanaAdapter(
  options: SolanaAdapterOptions = {},
): SolanaAdapter {
  return new SolanaAdapter(options);
}

function normalizeAccountInfo(
  pubkey: PublicKey,
  accountInfo: SolanaRawAccountInfo,
): SolanaAccountInfo {
  return SolanaAccountInfoSchema.parse({
    pubkey: pubkey.toBase58(),
    lamports: accountInfo.lamports,
    owner: accountInfo.owner.toBase58(),
    executable: accountInfo.executable,
    rentEpoch: Number(accountInfo.rentEpoch ?? 0),
    dataBase64: Buffer.from(accountInfo.data).toString("base64"),
  });
}

function normalizeProgramAccount(
  programAccount: SolanaRawProgramAccount,
): ProgramAccount {
  const pubkey = new PublicKey(programAccount.pubkey.toBase58());

  return ProgramAccountSchema.parse({
    pubkey: pubkey.toBase58(),
    account: normalizeAccountInfo(pubkey, programAccount.account),
  });
}

function endpointStatusFromHttpStatus(
  statusCode: number,
): EndpointHealth["status"] {
  if (statusCode >= 500) {
    return "degraded";
  }

  return "healthy";
}
