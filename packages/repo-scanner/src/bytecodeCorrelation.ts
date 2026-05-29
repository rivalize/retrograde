import type {
  BytecodeCorrelationResult,
  RepoFile,
  Vulnerability,
} from "./types.js";

const BYTECODE_KEYS = ["deployedBytecode", "bytecode"];

/**
 * Correlates on-chain bytecode with repository build artifacts.
 *
 * @param files - Repository files to inspect.
 * @param onChainBytecode - 0x-prefixed on-chain bytecode.
 * @returns Bytecode correlation result.
 */
export function correlateOnChainBytecode(
  files: readonly RepoFile[],
  onChainBytecode?: string,
): BytecodeCorrelationResult {
  const artifacts = extractArtifactBytecodes(files);

  if (!onChainBytecode) {
    return {
      matched: false,
      artifactCount: artifacts.length,
    };
  }

  const normalizedOnChain = normalizeBytecode(onChainBytecode);
  const strippedOnChain = stripSolidityMetadata(normalizedOnChain);

  for (const artifact of artifacts) {
    const normalizedArtifact = normalizeBytecode(artifact.bytecode);

    if (normalizedArtifact === normalizedOnChain) {
      return {
        matched: true,
        artifactPath: artifact.path,
        matchType: "exact",
        artifactCount: artifacts.length,
      };
    }

    if (stripSolidityMetadata(normalizedArtifact) === strippedOnChain) {
      return {
        matched: true,
        artifactPath: artifact.path,
        matchType: "metadata-stripped",
        artifactCount: artifacts.length,
      };
    }
  }

  return {
    matched: false,
    artifactCount: artifacts.length,
  };
}

/**
 * Creates vulnerabilities for missing or failed bytecode correlation.
 *
 * @param result - Bytecode correlation result.
 * @param onChainBytecode - Optional bytecode passed into the scan.
 * @returns Correlation vulnerabilities.
 */
export function buildBytecodeCorrelationVulnerabilities(
  result: BytecodeCorrelationResult,
  onChainBytecode?: string,
): Vulnerability[] {
  if (!onChainBytecode) {
    return [
      {
        id: "repo-bytecode-correlation-not-provided",
        severity: "info",
        type: "source-correlation",
        description:
          "No on-chain bytecode was provided, so repository source could not be correlated to deployed code.",
      },
    ];
  }

  if (result.matched) {
    return [];
  }

  return [
    {
      id: "repo-bytecode-correlation-failed",
      severity: result.artifactCount > 0 ? "high" : "medium",
      type: "source-correlation",
      description:
        result.artifactCount > 0
          ? "On-chain bytecode did not match any scanned repository build artifact."
          : "No repository build artifacts with bytecode were found for on-chain source correlation.",
    },
  ];
}

interface ExtractedArtifact {
  path: string;
  bytecode: string;
}

function extractArtifactBytecodes(
  files: readonly RepoFile[],
): ExtractedArtifact[] {
  const artifacts: ExtractedArtifact[] = [];

  for (const file of files.filter(
    (candidate) =>
      candidate.kind === "artifact" || candidate.path.endsWith(".json"),
  )) {
    const parsed = parseJson(file.content);

    if (!parsed) {
      continue;
    }

    for (const key of BYTECODE_KEYS) {
      const value = readBytecodeValue(parsed[key]);

      if (value) {
        artifacts.push({ path: file.path, bytecode: value });
      }
    }
  }

  return artifacts;
}

function parseJson(content: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(content);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function readBytecodeValue(value: unknown): string | undefined {
  if (typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value)) {
    return value;
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const objectValue = value as Record<string, unknown>;
    return readBytecodeValue(objectValue.object);
  }

  return undefined;
}

function normalizeBytecode(bytecode: string): string {
  return bytecode.toLowerCase();
}

function stripSolidityMetadata(bytecode: string): string {
  const withoutPrefix = bytecode.replace(/^0x/, "");

  if (withoutPrefix.length < 4) {
    return bytecode;
  }

  const metadataLengthHex = withoutPrefix.slice(-4);
  const metadataLengthBytes = Number.parseInt(metadataLengthHex, 16);
  const metadataHexLength = metadataLengthBytes * 2 + 4;

  if (
    !Number.isFinite(metadataLengthBytes) ||
    metadataHexLength <= 4 ||
    metadataHexLength >= withoutPrefix.length
  ) {
    return bytecode;
  }

  return `0x${withoutPrefix.slice(0, -metadataHexLength)}`;
}
