import { describe, expect, it } from "vitest";
import { analyzeRepositorySnapshot } from "../src/analyzers.js";
import type { RepoSnapshot } from "../src/types.js";

function createSnapshot(files: RepoSnapshot["files"]): RepoSnapshot {
  return {
    metadata: {
      provider: "github",
      owner: "rivalize",
      repo: "retrograde",
      defaultBranch: "main",
      webUrl: "https://github.com/rivalize/retrograde",
      isPrivate: false,
    },
    files,
  };
}

describe("analyzeRepositorySnapshot", () => {
  it("detects exposed secrets, stack drift, install scripts, workflow risks, and missing security policy", () => {
    const report = analyzeRepositorySnapshot(
      createSnapshot([
        {
          path: "src/config.ts",
          kind: "source",
          sizeBytes: 80,
          content: "const token = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';",
        },
        {
          path: "package.json",
          kind: "manifest",
          sizeBytes: 160,
          content: JSON.stringify({
            dependencies: { ethers: "6.0.0" },
            scripts: { postinstall: "node scripts/postinstall.js" },
          }),
        },
        {
          path: ".github/workflows/ci.yml",
          kind: "workflow",
          sizeBytes: 120,
          content:
            "on:\n  pull_request_target:\nsteps:\n - uses: actions/checkout@v4\n - run: curl https://example.com/install.sh | bash",
        },
      ]),
    );
    const ids = report.vulnerabilities.map((vulnerability) => vulnerability.id);

    expect(ids).toContain("repo-secret-github-token:src/config.ts");
    expect(ids).toContain("repo-dependency-ethers");
    expect(ids).toContain("repo-package-install-script");
    expect(ids).toContain("repo-missing-js-lockfile");
    expect(ids).toContain(
      "repo-workflow-pr-target-checkout:.github/workflows/ci.yml",
    );
    expect(ids).toContain("repo-workflow-curl-shell:.github/workflows/ci.yml");
    expect(ids).toContain("repo-missing-security-policy");
    expect(report.metadata).toMatchObject({ fileCount: 3, provider: "github" });
  });

  it("does not report missing security policy when SECURITY.md is scanned", () => {
    const report = analyzeRepositorySnapshot(
      createSnapshot([
        {
          path: "SECURITY.md",
          kind: "unknown",
          sizeBytes: 20,
          content: "security policy",
        },
      ]),
    );

    expect(
      report.vulnerabilities.some(
        (vulnerability) => vulnerability.id === "repo-missing-security-policy",
      ),
    ).toBe(false);
  });
});
