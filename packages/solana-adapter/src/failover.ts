import type { Logger } from "pino";
import { SolanaProviderFailoverError, toErrorMessage } from "./errors.js";
import type { SolanaRpcProvider } from "./types.js";

export interface FailoverOptions {
  maxAttemptsPerProvider?: number;
  baseDelayMs?: number;
  logger?: Logger;
}

/**
 * Executes a Solana RPC operation across providers with exponential backoff and failover.
 *
 * @param providers - Ordered Solana RPC providers.
 * @param operation - Operation label for logs and errors.
 * @param execute - Provider operation callback.
 * @param options - Optional retry and logging controls.
 * @returns Operation result from the first successful provider.
 */
export async function withSolanaProviderFailover<T>(
  providers: readonly SolanaRpcProvider[],
  operation: string,
  execute: (provider: SolanaRpcProvider) => Promise<T>,
  options: FailoverOptions = {},
): Promise<T> {
  const maxAttemptsPerProvider = options.maxAttemptsPerProvider ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 250;
  const errors: string[] = [];

  for (const provider of providers) {
    for (let attempt = 1; attempt <= maxAttemptsPerProvider; attempt += 1) {
      try {
        return await execute(provider);
      } catch (error) {
        const message = toErrorMessage(error);
        errors.push(`${provider.name}[${attempt}]: ${message}`);
        options.logger?.warn(
          { provider: provider.name, attempt, operation, error: message },
          "solana provider attempt failed",
        );

        if (attempt < maxAttemptsPerProvider) {
          await delay(baseDelayMs * 2 ** (attempt - 1));
        }
      }
    }
  }

  throw new SolanaProviderFailoverError(operation, errors);
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
