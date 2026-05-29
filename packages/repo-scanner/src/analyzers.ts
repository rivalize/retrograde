import { RepoAnalysisReportSchema } from "./schemas.js";
import type {
  RepoAnalysisReport,
  RepoFile,
  RepoSnapshot,
  Vulnerability,
} from "./types.js";

interface SecretPattern {
  id: string;
  type: string;
  description: string;
  pattern: RegExp;
  severity: Vulnerability["severity"];
}

const SECRET_PATTERNS: readonly SecretPattern[] = [
  {
    id: "repo-secret-private-key",
    type: "secret-exposure",
    description: "Repository content appears to contain a private key block.",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/i,
    severity: "critical",
  },
  {
    id: "repo-secret-github-token",
    type: "secret-exposure",
    description: "Repository content appears to contain a GitHub token.",
    pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
    severity: "critical",
  },
  {
    id: "repo-secret-npm-token",
    type: "secret-exposure",
    description: "Repository content appears to contain an npm access token.",
    pattern: /\bnpm_[A-Za-z0-9]{30,}\b/,
    severity: "critical",
  },
  {
    id: "repo-secret-rpc-api-key",
    type: "secret-exposure",
    description:
      "Repository content appears to contain a hardcoded RPC provider API key.",
    pattern:
      /\b(?:alchemy|infura|helius)[_-]?(?:api)?[_-]?key\s*[:=]\s*["'][A-Za-z0-9_-]{20,}["']/i,
    severity: "high",
  },
];

/**
 * Runs repository source and configuration analysis.
 *
 * @param snapshot - Repository snapshot fetched from a provider.
 * @returns Repository analysis report.
 */
export function analyzeRepositorySnapshot(
  snapshot: RepoSnapshot,
): RepoAnalysisReport {
  const vulnerabilities = dedupeVulnerabilities([
    ...analyzeSecretExposure(snapshot.files),
    ...analyzeDependencyManifests(snapshot.files),
    ...analyzeWorkflowRisks(snapshot.files),
    ...analyzeRepositoryHygiene(snapshot),
  ]);

  return RepoAnalysisReportSchema.parse({
    vulnerabilities,
    metadata: {
      fileCount: snapshot.files.length,
      analyzedBytes: snapshot.files.reduce(
        (total, file) => total + file.sizeBytes,
        0,
      ),
      provider: snapshot.metadata.provider,
      defaultBranch: snapshot.metadata.defaultBranch,
    },
  });
}

/**
 * Detects exposed secrets in repository files.
 *
 * @param files - Repository files to inspect.
 * @returns Secret exposure vulnerabilities.
 */
export function analyzeSecretExposure(
  files: readonly RepoFile[],
): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];

  for (const file of files) {
    for (const secretPattern of SECRET_PATTERNS) {
      if (!secretPattern.pattern.test(file.content)) {
        continue;
      }

      vulnerabilities.push({
        id: `${secretPattern.id}:${file.path}`,
        severity: secretPattern.severity,
        type: secretPattern.type,
        description: secretPattern.description,
        location: file.path,
      });
    }
  }

  return vulnerabilities;
}

/**
 * Detects risky package manifest choices.
 *
 * @param files - Repository files to inspect.
 * @returns Dependency and manifest vulnerabilities.
 */
export function analyzeDependencyManifests(
  files: readonly RepoFile[],
): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  const packageJson = files.find((file) => file.path.endsWith("package.json"));

  if (packageJson) {
    const packageData = parseJsonObject(packageJson.content);
    const dependencies = {
      ...readObject(packageData.dependencies),
      ...readObject(packageData.devDependencies),
    };

    if ("ethers" in dependencies) {
      vulnerabilities.push({
        id: "repo-dependency-ethers",
        severity: "medium",
        type: "stack-drift",
        description:
          "Repository depends on ethers; Retrograde's EVM stack is standardized on viem.",
        location: packageJson.path,
      });
    }

    if (hasInstallScript(packageData.scripts)) {
      vulnerabilities.push({
        id: "repo-package-install-script",
        severity: "medium",
        type: "supply-chain-risk",
        description:
          "package.json defines install-time scripts; dependency installation can execute arbitrary code.",
        location: packageJson.path,
      });
    }
  }

  const hasPackageJson = Boolean(packageJson);
  const hasLockfile = files.some(
    (file) =>
      file.path.endsWith("pnpm-lock.yaml") ||
      file.path.endsWith("package-lock.json") ||
      file.path.endsWith("yarn.lock"),
  );

  if (hasPackageJson && !hasLockfile) {
    vulnerabilities.push({
      id: "repo-missing-js-lockfile",
      severity: "low",
      type: "supply-chain-risk",
      description:
        "JavaScript package manifest is present without a lockfile; dependency resolution is not reproducible.",
      location: packageJson?.path,
    });
  }

  return vulnerabilities;
}

/**
 * Detects risky CI workflow patterns.
 *
 * @param files - Repository files to inspect.
 * @returns Workflow vulnerabilities.
 */
export function analyzeWorkflowRisks(
  files: readonly RepoFile[],
): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];

  for (const file of files.filter(
    (candidate) => candidate.kind === "workflow",
  )) {
    if (
      /pull_request_target\s*:/i.test(file.content) &&
      /checkout@v[1-4]/i.test(file.content)
    ) {
      vulnerabilities.push({
        id: `repo-workflow-pr-target-checkout:${file.path}`,
        severity: "high",
        type: "ci-risk",
        description:
          "Workflow uses pull_request_target with checkout; untrusted PR content can run with elevated permissions if not constrained.",
        location: file.path,
      });
    }

    if (/curl\s+[^|\n]+\|\s*(?:bash|sh)/i.test(file.content)) {
      vulnerabilities.push({
        id: `repo-workflow-curl-shell:${file.path}`,
        severity: "medium",
        type: "ci-risk",
        description: "Workflow pipes remote curl output into a shell.",
        location: file.path,
      });
    }
  }

  return vulnerabilities;
}

/**
 * Checks repository-level security hygiene.
 *
 * @param snapshot - Repository snapshot.
 * @returns Repository hygiene vulnerabilities.
 */
export function analyzeRepositoryHygiene(
  snapshot: RepoSnapshot,
): Vulnerability[] {
  const hasSecurityPolicy = snapshot.files.some(
    (file) =>
      file.path.toLowerCase() === "security.md" ||
      file.path.toLowerCase().endsWith("/security.md"),
  );

  if (hasSecurityPolicy) {
    return [];
  }

  return [
    {
      id: "repo-missing-security-policy",
      severity: "info",
      type: "security-hygiene",
      description:
        "Repository does not include a SECURITY.md disclosure policy in the scanned files.",
      location: snapshot.metadata.webUrl,
    },
  ];
}

function parseJsonObject(content: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(content);
    return readObject(parsed);
  } catch {
    return {};
  }
}

function readObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function hasInstallScript(value: unknown): boolean {
  const scripts = readObject(value);
  return ["preinstall", "install", "postinstall"].some(
    (scriptName) => typeof scripts[scriptName] === "string",
  );
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
