import type { GetProgramAccountsConfig, PublicKey } from "@solana/web3.js";

export type EndpointStatus = "healthy" | "degraded" | "down";

export interface EndpointHealth {
  url: string;
  status: EndpointStatus;
  statusCode?: number;
  latencyMs: number;
  checkedAt: Date;
  error?: string;
}

export interface SolanaAccountInfo {
  pubkey: string;
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch: number;
  dataBase64: string;
}

export interface ProgramAccount {
  pubkey: string;
  account: SolanaAccountInfo;
}

export interface AccountUpdate {
  pubkey: string;
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch?: number | undefined;
  dataBase64: string;
  slot?: number | undefined;
  source: "yellowstone" | "websocket";
  receivedAt: Date;
}

export interface SolanaRpcProvider {
  name: string;
  url: string;
  connection: SolanaConnection;
}

export interface SolanaConnection {
  getAccountInfo(
    pubkey: PublicKey,
    commitment?: "confirmed",
  ): Promise<SolanaRawAccountInfo | null>;
  getProgramAccounts(
    pubkey: PublicKey,
    config?: GetProgramAccountsConfig,
  ): Promise<SolanaRawProgramAccount[]>;
  getSlot(commitment?: string): Promise<number>;
  onAccountChange(
    pubkey: PublicKey,
    callback: (
      accountInfo: SolanaRawAccountInfo,
      context: { slot: number },
    ) => void,
    commitment?: "confirmed",
  ): number;
  removeAccountChangeListener(subscriptionId: number): Promise<void>;
}

export interface SolanaRawAccountInfo {
  lamports: number;
  owner: { toBase58(): string };
  executable: boolean;
  rentEpoch?: number | bigint;
  data: Uint8Array | Buffer;
}

export interface SolanaRawProgramAccount {
  pubkey: { toBase58(): string };
  account: SolanaRawAccountInfo;
}

export interface YellowstoneClient {
  subscribe(): Promise<YellowstoneSubscribeStream>;
  close(): void;
}

export interface YellowstoneSubscribeStream {
  on(
    event: "data",
    listener: (update: YellowstoneSubscribeUpdate) => void,
  ): this;
  on(
    event: "error" | "end" | "close",
    listener: (error?: unknown) => void,
  ): this;
  write(request: unknown, callback: (error?: Error | null) => void): void;
  end(): void;
}

export interface YellowstoneSubscribeUpdate {
  account?: {
    slot?: number | bigint | string;
    account?: {
      pubkey?: Uint8Array | Buffer | string;
      lamports?: number | bigint | string;
      owner?: Uint8Array | Buffer | string;
      executable?: boolean;
      rentEpoch?: number | bigint | string;
      data?: Uint8Array | Buffer | string;
    };
  };
}

export interface YellowstoneConfig {
  endpoint: string;
  token: string;
}
