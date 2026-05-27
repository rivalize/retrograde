/**
 * Converts an unknown thrown value into a durable error message.
 *
 * @param error - Unknown error value.
 * @returns Human-readable error message.
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

export class InvalidPublicKeyError extends Error {
  /**
   * Creates an invalid Solana public key error.
   *
   * @param pubkey - Public key that failed validation.
   * @returns Invalid public key error instance.
   */
  constructor(pubkey: string) {
    super(`Invalid Solana public key: ${pubkey}`);
    this.name = "InvalidPublicKeyError";
  }
}

export class SolanaProviderFailoverError extends Error {
  readonly providerErrors: readonly string[];

  /**
   * Creates a provider failover exhaustion error.
   *
   * @param operation - Operation that failed across all providers.
   * @param providerErrors - Provider-specific failure messages.
   * @returns Solana provider failover error instance.
   */
  constructor(operation: string, providerErrors: readonly string[]) {
    super(`All Solana providers failed for ${operation}`);
    this.name = "SolanaProviderFailoverError";
    this.providerErrors = providerErrors;
  }
}

export class YellowstoneUnavailableError extends Error {
  /**
   * Creates a Yellowstone configuration error.
   *
   * @returns Yellowstone unavailable error instance.
   */
  constructor() {
    super(
      "Yellowstone Geyser subscription requires HELIUS_GEYSER_URL and HELIUS_API_KEY.",
    );
    this.name = "YellowstoneUnavailableError";
  }
}
