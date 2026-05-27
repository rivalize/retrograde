import { z } from "zod";

export const EndpointStatusSchema = z.enum(["healthy", "degraded", "down"]);

export const EndpointHealthSchema = z.object({
  url: z.string().url(),
  status: EndpointStatusSchema,
  statusCode: z.number().int().min(100).max(599).optional(),
  latencyMs: z.number().nonnegative(),
  checkedAt: z.coerce.date(),
  error: z.string().min(1).optional(),
});

export const SolanaAccountInfoSchema = z.object({
  pubkey: z.string().min(32),
  lamports: z.number().nonnegative(),
  owner: z.string().min(32),
  executable: z.boolean(),
  rentEpoch: z.number().nonnegative(),
  dataBase64: z.string(),
});

export const ProgramAccountSchema = z.object({
  pubkey: z.string().min(32),
  account: SolanaAccountInfoSchema,
});

export const AccountUpdateSchema = z.object({
  pubkey: z.string().min(32),
  lamports: z.number().nonnegative(),
  owner: z.string().min(32),
  executable: z.boolean(),
  rentEpoch: z.number().nonnegative().optional(),
  dataBase64: z.string(),
  slot: z.number().nonnegative().optional(),
  source: z.enum(["yellowstone", "websocket"]),
  receivedAt: z.coerce.date(),
});
