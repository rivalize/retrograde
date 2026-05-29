import { describe, expect, it, vi } from "vitest";
import { scanRepository } from "../src/repoScanner.js";

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("scanRepository", () => {
  it("returns canonical ScanResult for repository findings and bytecode correlation", async () => {
    const fetchFn = vi.fn<typeof fetch>(async (url) => {
      const requestUrl = String(url);

      if (requestUrl.endsWith("/repos/rivalize/retrograde")) {
        return jsonResponse({
          name: "retrograde",
          full_name: "rivalize/retrograde",
          private: false,
          html_url: "https://github.com/rivalize/retrograde",
          default_branch: "main",
          description: "scanner",
        });
      }

      if (requestUrl.includes("/git/trees/main")) {
        return jsonResponse({
          tree: [
            {
              path: "package.json",
              type: "blob",
              size: 80,
              url: "https://api.github.com/blob/package",
            },
            {
              path: "artifacts/Registry.json",
              type: "blob",
              size: 80,
              url: "https://api.github.com/blob/artifact",
            },
          ],
        });
      }

      if (requestUrl.endsWith("/blob/package")) {
        return jsonResponse({
          content: Buffer.from(
            JSON.stringify({ dependencies: { ethers: "6.0.0" } }),
          ).toString("base64"),
          encoding: "base64",
        });
      }

      return jsonResponse({
        content: Buffer.from(
          JSON.stringify({ deployedBytecode: "0x60016002" }),
        ).toString("base64"),
        encoding: "base64",
      });
    });

    const result = await scanRepository({
      chain: "ethereum",
      target: "https://github.com/rivalize/retrograde",
      onChainBytecode: "0x60016002",
      fetchFn,
    });

    expect(result).toMatchObject({
      chain: "ethereum",
      target: "https://github.com/rivalize/retrograde",
      targetType: "repo",
      status: "vulnerable",
    });
    expect(
      result.vulnerabilities.map((vulnerability) => vulnerability.id),
    ).toContain("repo-dependency-ethers");
    expect(result.metadata.bytecodeCorrelation).toMatchObject({
      matched: true,
      matchType: "exact",
    });
  });
});
