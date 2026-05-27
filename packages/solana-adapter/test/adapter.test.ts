import { Buffer } from "node:buffer";
import pino from "pino";
import { PublicKey } from "@solana/web3.js";
import { describe, expect, it, vi } from "vitest";
import { SolanaAdapter } from "../src/adapter.js";
import {
  InvalidPublicKeyError,
  SolanaProviderFailoverError,
} from "../src/errors.js";
import type {
  AccountUpdate,
  SolanaConnection,
  SolanaRawAccountInfo,
  SolanaRawProgramAccount,
  SolanaRpcProvider,
} from "../src/types.js";

const logger = pino({ level: "silent" });
const ACCOUNT = new PublicKey("So11111111111111111111111111111111111111112");
const PROGRAM = new PublicKey("11111111111111111111111111111111");

function createRawAccount(
  overrides: Partial<SolanaRawAccountInfo> = {},
): SolanaRawAccountInfo {
  return {
    lamports: 1_000,
    owner: PROGRAM,
    executable: false,
    rentEpoch: 22,
    data: Buffer.from("retrograde"),
    ...overrides,
  };
}

function createConnection(
  overrides: Partial<SolanaConnection> = {},
): SolanaConnection {
  return {
    async getAccountInfo() {
      return createRawAccount();
    },
    async getProgramAccounts() {
      return [
        {
          pubkey: ACCOUNT,
          account: createRawAccount(),
        },
      ];
    },
    async getSlot() {
      return 123;
    },
    onAccountChange(_pubkey, callback) {
      callback(createRawAccount({ lamports: 2_000 }), { slot: 456 });
      return 42;
    },
    async removeAccountChangeListener() {
      return undefined;
    },
    ...overrides,
  };
}

function createProvider(
  name: string,
  connection: SolanaConnection,
): SolanaRpcProvider {
  return {
    name,
    url: `https://${name}.example`,
    connection,
  };
}

describe("SolanaAdapter", () => {
  it("checks endpoint health", async () => {
    const fetchFn = vi.fn<typeof fetch>(
      async () => new Response("ok", { status: 200 }),
    );
    const adapter = new SolanaAdapter({
      providers: [],
      fetchFn,
      logger,
    });

    const health = await adapter.checkEndpoint("https://rpc.example");

    expect(health.status).toBe("healthy");
    expect(health.statusCode).toBe(200);
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("marks failing endpoints down", async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => {
      throw new Error("network down");
    });
    const adapter = new SolanaAdapter({
      providers: [],
      fetchFn,
      logger,
    });

    const health = await adapter.checkEndpoint("https://rpc.example");

    expect(health.status).toBe("down");
    expect(health.error).toBe("network down");
  });

  it("normalizes account info", async () => {
    const adapter = new SolanaAdapter({
      providers: [createProvider("helius", createConnection())],
      logger,
    });

    const account = await adapter.getAccountInfo(ACCOUNT.toBase58());

    expect(account).toEqual({
      pubkey: ACCOUNT.toBase58(),
      lamports: 1_000,
      owner: PROGRAM.toBase58(),
      executable: false,
      rentEpoch: 22,
      dataBase64: Buffer.from("retrograde").toString("base64"),
    });
  });

  it("normalizes program accounts", async () => {
    const programAccount: SolanaRawProgramAccount = {
      pubkey: ACCOUNT,
      account: createRawAccount({ data: Buffer.from("program") }),
    };
    const adapter = new SolanaAdapter({
      providers: [
        createProvider(
          "helius",
          createConnection({
            async getProgramAccounts() {
              return [programAccount];
            },
          }),
        ),
      ],
      logger,
    });

    const accounts = await adapter.getProgramAccounts(PROGRAM.toBase58());

    expect(accounts).toHaveLength(1);
    expect(accounts[0]?.account.dataBase64).toBe(
      Buffer.from("program").toString("base64"),
    );
  });

  it("fails over between providers for slot liveness", async () => {
    const adapter = new SolanaAdapter({
      providers: [
        createProvider(
          "helius",
          createConnection({
            async getSlot() {
              throw new Error("rate limited");
            },
          }),
        ),
        createProvider(
          "chainstack",
          createConnection({
            async getSlot() {
              return 999;
            },
          }),
        ),
      ],
      logger,
    });

    await expect(adapter.getSlot()).resolves.toBe(999);
  });

  it("throws a typed failover error when all slot providers fail", async () => {
    const adapter = new SolanaAdapter({
      providers: [
        createProvider(
          "public",
          createConnection({
            async getSlot() {
              throw new Error("unavailable");
            },
          }),
        ),
      ],
      logger,
    });

    await expect(adapter.getSlot()).rejects.toBeInstanceOf(
      SolanaProviderFailoverError,
    );
  });

  it("measures RPC latency with a slot lookup", async () => {
    const adapter = new SolanaAdapter({
      providers: [createProvider("helius", createConnection())],
      logger,
    });

    await expect(adapter.getLatency()).resolves.toBeGreaterThanOrEqual(0);
  });

  it("validates public keys", async () => {
    const adapter = new SolanaAdapter({
      providers: [],
      logger,
    });

    await expect(adapter.getAccountInfo("not-a-key")).rejects.toBeInstanceOf(
      InvalidPublicKeyError,
    );
  });

  it("uses websocket subscriptions when Yellowstone is not configured", () => {
    const removeListener = vi.fn<() => Promise<void>>(async () => undefined);
    const updates: AccountUpdate[] = [];
    const adapter = new SolanaAdapter({
      providers: [
        createProvider(
          "helius",
          createConnection({
            async removeAccountChangeListener(subscriptionId) {
              expect(subscriptionId).toBe(42);
              await removeListener();
            },
          }),
        ),
      ],
      logger,
    });

    const unsubscribe = adapter.subscribeAccountUpdates(
      ACCOUNT.toBase58(),
      (update) => {
        updates.push(update);
      },
    );
    unsubscribe();

    expect(updates[0]).toMatchObject({
      pubkey: ACCOUNT.toBase58(),
      lamports: 2_000,
      source: "websocket",
      slot: 456,
    });
    expect(removeListener).toHaveBeenCalledTimes(1);
  });
});
