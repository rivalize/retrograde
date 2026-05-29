import { randomUUID } from "node:crypto";
import { ScanResultSchema } from "@retrograde/scanner-core";
import { analyzeRepositorySnapshot } from "./analyzers.js";
import {
  buildBytecodeCorrelationVulnerabilities,
  correlateOnChainBytecode,
} from "./bytecodeCorrelation.js";
import { getRepositoryProvider, parseRepoLocator } from "./providers.js";
import { RepoScannerOptionsSchema } from "./schemas.js";
import type { RepoScannerOptions, ScanResult, Vulnerability } from "./types.js";

/**
 * Scans a GitHub, GitLab, or Bitbucket repository and normalizes findings to `ScanResult`.
 *
 * @param options - Repository target, chain context, fetch controls, and optional on-chain bytecode.
 * @returns Canonical repository scan result.
 */
export async function scanRepository(
  options: RepoScannerOptions,
): Promise<ScanResult> {
  const parsedOptions = RepoScannerOptionsSchema.parse(options);
  const locator = parseRepoLocator(parsedOptions.target, parsedOptions.ref);
  const provider = getRepositoryProvider(locator.provider);
  const checkedAt = new Date();
  const snapshot = await provider.fetchSnapshot(locator, {
    fetchFn: options.fetchFn ?? fetch,
    maxFiles: parsedOptions.maxFiles,
    maxFileSizeBytes: parsedOptions.maxFileSizeBytes,
  });
  const repoAnalysis = analyzeRepositorySnapshot(snapshot);
  const bytecodeCorrelation = correlateOnChainBytecode(
    snapshot.files,
    parsedOptions.onChainBytecode,
  );
  const vulnerabilities = dedupeVulnerabilities([
    ...repoAnalysis.vulnerabilities,
    ...buildBytecodeCorrelationVulnerabilities(
      bytecodeCorrelation,
      parsedOptions.onChainBytecode,
    ),
  ]);

  return ScanResultSchema.parse({
    id: randomUUID(),
    chain: parsedOptions.chain,
    target: snapshot.metadata.webUrl,
    targetType: "repo",
    status: vulnerabilities.some(
      (vulnerability) => vulnerability.severity !== "info",
    )
      ? "vulnerable"
      : "healthy",
    latency: {
      p50: 0,
      p95: 0,
      p99: 0,
    },
    vulnerabilities,
    checkedAt,
    metadata: {
      scanner: "reposcan-plus",
      repository: snapshot.metadata,
      ...repoAnalysis.metadata,
      bytecodeCorrelation,
    },
  });
}

function dedupeVulnerabilities(
  vulnerabilities: readonly Vulnerability[],
): Vulnerability[] {
  const seen = new Set<string>();
  const deduped: Vulnerability[] = [];

  for (const vulnerability of vulnerabilities) {
    if (seen.has(vulnerability.id)) {
      continue;
    }

    seen.add(vulnerability.id);
    deduped.push(vulnerability);
  }

  return deduped;
}
