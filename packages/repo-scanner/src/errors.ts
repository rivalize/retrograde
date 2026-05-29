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

export class RepoScannerError extends Error {
  /**
   * Creates a repository scanner error.
   *
   * @param message - Error message.
   * @returns Repository scanner error instance.
   */
  constructor(message: string) {
    super(message);
    this.name = "RepoScannerError";
  }
}

export class UnsupportedRepoProviderError extends RepoScannerError {
  /**
   * Creates an unsupported repository provider error.
   *
   * @param target - Unsupported repository target.
   * @returns Unsupported provider error instance.
   */
  constructor(target: string) {
    super(`Unsupported repository provider for target: ${target}`);
    this.name = "UnsupportedRepoProviderError";
  }
}

export class RepoFetchError extends RepoScannerError {
  /**
   * Creates a repository fetch error.
   *
   * @param provider - Provider name.
   * @param status - HTTP status code.
   * @param path - API path that failed.
   * @returns Repository fetch error instance.
   */
  constructor(provider: string, status: number, path: string) {
    super(`${provider} repository API request failed with ${status}: ${path}`);
    this.name = "RepoFetchError";
  }
}
