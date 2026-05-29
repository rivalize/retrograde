import type {
  ChainId,
  ScanResult,
  Vulnerability,
  VulnerabilitySeverity,
} from "@retrograde/scanner-core";

export type RepoProvider = "github" | "gitlab" | "bitbucket";
export type RepoFileKind =
  | "source"
  | "manifest"
  | "workflow"
  | "artifact"
  | "config"
  | "unknown";

export type { ChainId, ScanResult, Vulnerability, VulnerabilitySeverity };

export interface RepoLocator {
  provider: RepoProvider;
  owner: string;
  repo: string;
  ref?: string | undefined;
  webUrl: string;
}

export interface RepoMetadata {
  provider: RepoProvider;
  owner: string;
  repo: string;
  defaultBranch: string;
  webUrl: string;
  isPrivate: boolean;
  description?: string | undefined;
}

export interface RepoFile {
  path: string;
  kind: RepoFileKind;
  sizeBytes: number;
  content: string;
}

export interface RepoSnapshot {
  metadata: RepoMetadata;
  files: RepoFile[];
}

export interface RepoScannerOptions {
  chain: ChainId;
  target: string;
  ref?: string;
  onChainBytecode?: string;
  maxFiles?: number;
  maxFileSizeBytes?: number;
  fetchFn?: typeof fetch;
}

export interface RepositoryProvider {
  readonly provider: RepoProvider;
  fetchSnapshot(
    locator: RepoLocator,
    options: RepoFetchOptions,
  ): Promise<RepoSnapshot>;
}

export interface RepoFetchOptions {
  fetchFn: typeof fetch;
  maxFiles: number;
  maxFileSizeBytes: number;
}

export interface RepoAnalysisReport {
  vulnerabilities: Vulnerability[];
  metadata: Record<string, unknown>;
}

export interface BytecodeCorrelationResult {
  matched: boolean;
  artifactPath?: string;
  matchType?: "exact" | "metadata-stripped";
  artifactCount: number;
}
