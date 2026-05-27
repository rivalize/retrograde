import {
  CommitmentLevel,
  type SubscribeRequest,
} from "@triton-one/yellowstone-grpc";
import { PublicKey } from "@solana/web3.js";
import { AccountUpdateSchema } from "./schemas.js";
import type {
  AccountUpdate,
  YellowstoneClient,
  YellowstoneSubscribeStream,
  YellowstoneSubscribeUpdate,
} from "./types.js";

export interface YellowstoneAccountSubscriptionOptions {
  client: YellowstoneClient;
  pubkey: PublicKey;
  onUpdate: (update: AccountUpdate) => void;
}

/**
 * Subscribes to one Solana account through Yellowstone Geyser.
 *
 * @param options - Yellowstone client, account public key, and update callback.
 * @returns Function that closes the subscription.
 */
export function subscribeYellowstoneAccountUpdates(
  options: YellowstoneAccountSubscriptionOptions,
): () => void {
  let stream: YellowstoneSubscribeStream | undefined;
  let closed = false;

  void openStream(options).then((openedStream) => {
    if (closed) {
      openedStream.end();
      return;
    }

    stream = openedStream;
  });

  return () => {
    closed = true;
    stream?.end();
    options.client.close();
  };
}

async function openStream(
  options: YellowstoneAccountSubscriptionOptions,
): Promise<YellowstoneSubscribeStream> {
  const stream = await options.client.subscribe();

  stream.on("data", (update) => {
    const parsed = parseYellowstoneAccountUpdate(update);

    if (parsed && parsed.pubkey === options.pubkey.toBase58()) {
      options.onUpdate(parsed);
    }
  });

  stream.on("error", () => {
    stream.end();
  });

  stream.on("end", () => {
    options.client.close();
  });

  stream.on("close", () => {
    options.client.close();
  });

  await writeSubscribeRequest(
    stream,
    buildAccountSubscribeRequest(options.pubkey),
  );

  return stream;
}

/**
 * Builds a Yellowstone account subscribe request.
 *
 * @param pubkey - Public key to subscribe to.
 * @returns Yellowstone subscribe request.
 */
export function buildAccountSubscribeRequest(
  pubkey: PublicKey,
): SubscribeRequest {
  return {
    accounts: {
      accountSubscribe: {
        account: [pubkey.toBase58()],
        owner: [],
        filters: [],
      },
    },
    accountsDataSlice: [],
    commitment: CommitmentLevel.CONFIRMED,
    slots: {},
    transactions: {},
    transactionsStatus: {},
    blocks: {},
    blocksMeta: {},
    entry: {},
  };
}

/**
 * Builds a Yellowstone keepalive ping request.
 *
 * @param id - Ping identifier.
 * @returns Yellowstone ping request.
 */
export function buildPingRequest(id: number): SubscribeRequest {
  return {
    ping: { id },
    accounts: {},
    accountsDataSlice: [],
    transactions: {},
    slots: {},
    blocks: {},
    blocksMeta: {},
    entry: {},
    transactionsStatus: {},
  };
}

/**
 * Parses a Yellowstone account update into Retrograde's normalized update shape.
 *
 * @param update - Raw Yellowstone subscribe update.
 * @returns Normalized account update when the payload contains an account; otherwise `undefined`.
 */
export function parseYellowstoneAccountUpdate(
  update: YellowstoneSubscribeUpdate,
): AccountUpdate | undefined {
  const accountEnvelope = update.account;

  if (!accountEnvelope?.account) {
    return undefined;
  }

  const account = accountEnvelope.account;

  if (!account.pubkey || !account.owner || !account.data) {
    return undefined;
  }

  const slot =
    accountEnvelope.slot === undefined
      ? undefined
      : Number(accountEnvelope.slot);
  const rentEpoch =
    account.rentEpoch === undefined ? undefined : Number(account.rentEpoch);

  return AccountUpdateSchema.parse({
    pubkey: bytesToBase58(account.pubkey),
    lamports: Number(account.lamports ?? 0),
    owner: bytesToBase58(account.owner),
    executable: account.executable ?? false,
    dataBase64: bytesToBase64(account.data),
    source: "yellowstone",
    receivedAt: new Date(),
    ...(rentEpoch === undefined ? {} : { rentEpoch }),
    ...(slot === undefined ? {} : { slot }),
  });
}

async function writeSubscribeRequest(
  stream: YellowstoneSubscribeStream,
  request: SubscribeRequest,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    stream.write(request, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function bytesToBase58(value: Uint8Array | Buffer | string): string {
  if (typeof value === "string") {
    return value;
  }

  return new PublicKey(value).toBase58();
}

function bytesToBase64(value: Uint8Array | Buffer | string): string {
  if (typeof value === "string") {
    return Buffer.from(value).toString("base64");
  }

  return Buffer.from(value).toString("base64");
}
