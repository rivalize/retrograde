import { Buffer } from "node:buffer";
import { EventEmitter } from "node:events";
import { PublicKey } from "@solana/web3.js";
import { CommitmentLevel } from "@triton-one/yellowstone-grpc";
import { describe, expect, it, vi } from "vitest";
import {
  buildAccountSubscribeRequest,
  buildPingRequest,
  parseYellowstoneAccountUpdate,
  subscribeYellowstoneAccountUpdates,
} from "../src/yellowstone.js";
import type {
  AccountUpdate,
  YellowstoneClient,
  YellowstoneSubscribeStream,
  YellowstoneSubscribeUpdate,
} from "../src/types.js";

const ACCOUNT = new PublicKey("So11111111111111111111111111111111111111112");
const OWNER = new PublicKey("11111111111111111111111111111111");

class MockYellowstoneStream
  extends EventEmitter
  implements YellowstoneSubscribeStream
{
  readonly writes: unknown[] = [];
  ended = false;

  override on(
    event: "data",
    listener: (update: YellowstoneSubscribeUpdate) => void,
  ): this;
  override on(
    event: "error" | "end" | "close",
    listener: (error?: unknown) => void,
  ): this;
  override on(event: string, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }

  write(request: unknown, callback: (error?: Error | null) => void): void {
    this.writes.push(request);
    callback();
  }

  end(): void {
    this.ended = true;
  }
}

class MockYellowstoneClient implements YellowstoneClient {
  closed = false;

  constructor(private readonly stream: MockYellowstoneStream) {}

  async subscribe(): Promise<YellowstoneSubscribeStream> {
    return this.stream;
  }

  close(): void {
    this.closed = true;
  }
}

describe("Yellowstone helpers", () => {
  it("builds account subscribe and ping requests", () => {
    expect(buildAccountSubscribeRequest(ACCOUNT)).toMatchObject({
      accounts: {
        accountSubscribe: {
          account: [ACCOUNT.toBase58()],
          owner: [],
          filters: [],
        },
      },
      commitment: CommitmentLevel.CONFIRMED,
    });

    expect(buildPingRequest(7).ping).toEqual({ id: 7 });
  });

  it("parses account updates into normalized payloads", () => {
    const update = parseYellowstoneAccountUpdate({
      account: {
        slot: "123",
        account: {
          pubkey: ACCOUNT.toBytes(),
          lamports: "5000",
          owner: OWNER.toBytes(),
          executable: false,
          rentEpoch: "9",
          data: Buffer.from("retrograde"),
        },
      },
    });

    expect(update).toMatchObject({
      pubkey: ACCOUNT.toBase58(),
      lamports: 5_000,
      owner: OWNER.toBase58(),
      executable: false,
      rentEpoch: 9,
      dataBase64: Buffer.from("retrograde").toString("base64"),
      slot: 123,
      source: "yellowstone",
    });
  });

  it("subscribes and routes matching Yellowstone account updates", async () => {
    const stream = new MockYellowstoneStream();
    const client = new MockYellowstoneClient(stream);
    const updates: AccountUpdate[] = [];
    const unsubscribe = subscribeYellowstoneAccountUpdates({
      client,
      pubkey: ACCOUNT,
      onUpdate(update) {
        updates.push(update);
      },
    });

    await vi.waitFor(() => {
      expect(stream.writes).toHaveLength(1);
    });

    stream.emit("data", {
      account: {
        slot: "321",
        account: {
          pubkey: ACCOUNT.toBytes(),
          lamports: "7000",
          owner: OWNER.toBytes(),
          executable: false,
          data: Buffer.from("update"),
        },
      },
    });
    unsubscribe();

    expect(updates[0]).toMatchObject({
      pubkey: ACCOUNT.toBase58(),
      lamports: 7_000,
      source: "yellowstone",
      slot: 321,
    });
    expect(stream.ended).toBe(true);
    expect(client.closed).toBe(true);
  });
});
