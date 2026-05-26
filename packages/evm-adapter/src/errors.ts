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

export class InvalidAddressError extends Error {
  /**
   * Creates an invalid EVM address error.
   *
   * @param address - Address that failed validation.
   * @returns Invalid address error instance.
   */
  constructor(address: string) {
    super(`Invalid EVM address: ${address}`);
    this.name = "InvalidAddressError";
  }
}

export class ProviderFailoverError extends Error {
  readonly providerErrors: readonly string[];

  /**
   * Creates a provider failover exhaustion error.
   *
   * @param operation - Operation that failed across all providers.
   * @param providerErrors - Provider-specific failure messages.
   * @returns Provider failover error instance.
   */
  constructor(operation: string, providerErrors: readonly string[]) {
    super(`All EVM providers failed for ${operation}`);
    this.name = "ProviderFailoverError";
    this.providerErrors = providerErrors;
  }
}

export class AdapterFeatureUnavailableError extends Error {
  /**
   * Creates an unsupported adapter feature error.
   *
   * @param feature - Feature that is unavailable from base EVM RPC.
   * @returns Adapter feature unavailable error instance.
   */
  constructor(feature: string) {
    super(
      `${feature} is unavailable from base EVM JSON-RPC; explorer integration is required.`,
    );
    this.name = "AdapterFeatureUnavailableError";
  }
}
