import { describe, expect, it } from "vitest";
import {
  buildBytecodeCorrelationVulnerabilities,
  correlateOnChainBytecode,
} from "../src/bytecodeCorrelation.js";
import type { RepoFile } from "../src/types.js";

const ARTIFACT_FILE: RepoFile = {
  path: "artifacts/RetroToken.json",
  kind: "artifact",
  sizeBytes: 100,
  content: JSON.stringify({
    deployedBytecode: "0x60016002",
  }),
};

describe("correlateOnChainBytecode", () => {
  it("matches exact artifact bytecode", () => {
    expect(correlateOnChainBytecode([ARTIFACT_FILE], "0x60016002")).toEqual({
      matched: true,
      artifactPath: "artifacts/RetroToken.json",
      matchType: "exact",
      artifactCount: 1,
    });
  });

  it("matches metadata-stripped Solidity bytecode", () => {
    const result = correlateOnChainBytecode(
      [
        {
          ...ARTIFACT_FILE,
          content: JSON.stringify({ bytecode: "0x6001aabb0002" }),
        },
      ],
      "0x6001ccdd0002",
    );

    expect(result).toMatchObject({
      matched: true,
      matchType: "metadata-stripped",
      artifactCount: 1,
    });
  });

  it("creates correlation vulnerabilities when bytecode is missing or unmatched", () => {
    expect(
      buildBytecodeCorrelationVulnerabilities(
        correlateOnChainBytecode([ARTIFACT_FILE]),
      )[0]?.id,
    ).toBe("repo-bytecode-correlation-not-provided");
    expect(
      buildBytecodeCorrelationVulnerabilities(
        correlateOnChainBytecode([ARTIFACT_FILE], "0x9999"),
        "0x9999",
      )[0],
    ).toMatchObject({
      id: "repo-bytecode-correlation-failed",
      severity: "high",
    });
  });
});
