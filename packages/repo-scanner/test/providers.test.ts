import { describe, expect, it, vi } from "vitest";
import {
  BitbucketRepositoryProvider,
  GitHubRepositoryProvider,
  GitLabRepositoryProvider,
  classifyRepoFile,
  parseRepoLocator,
} from "../src/providers.js";

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("parseRepoLocator", () => {
  it("parses GitHub, GitLab, and Bitbucket URLs", () => {
    expect(
      parseRepoLocator("https://github.com/rivalize/retrograde.git"),
    ).toMatchObject({
      provider: "github",
      owner: "rivalize",
      repo: "retrograde",
    });
    expect(
      parseRepoLocator("https://gitlab.com/rivalize/retrograde"),
    ).toMatchObject({ provider: "gitlab" });
    expect(
      parseRepoLocator("https://bitbucket.org/rivalize/retrograde"),
    ).toMatchObject({ provider: "bitbucket" });
  });
});

describe("classifyRepoFile", () => {
  it("classifies files by path", () => {
    expect(classifyRepoFile("contracts/Registry.sol")).toBe("source");
    expect(classifyRepoFile("package.json")).toBe("manifest");
    expect(classifyRepoFile(".github/workflows/ci.yml")).toBe("workflow");
    expect(classifyRepoFile("artifacts/Registry.json")).toBe("artifact");
  });
});

describe("repository providers", () => {
  it("fetches GitHub snapshots", async () => {
    const fetchFn = vi.fn<typeof fetch>(async (url) => {
      const requestUrl = String(url);

      if (requestUrl.endsWith("/repos/rivalize/retrograde")) {
        return jsonResponse({
          name: "retrograde",
          full_name: "rivalize/retrograde",
          private: false,
          html_url: "https://github.com/rivalize/retrograde",
          default_branch: "main",
          description: null,
        });
      }

      if (requestUrl.includes("/git/trees/main")) {
        return jsonResponse({
          tree: [
            {
              path: "package.json",
              type: "blob",
              size: 20,
              url: "https://api.github.com/blob/package",
            },
          ],
        });
      }

      return jsonResponse({
        content: Buffer.from('{"dependencies":{}}').toString("base64"),
        encoding: "base64",
      });
    });

    const snapshot = await new GitHubRepositoryProvider().fetchSnapshot(
      parseRepoLocator("https://github.com/rivalize/retrograde"),
      {
        fetchFn,
        maxFiles: 10,
        maxFileSizeBytes: 100_000,
      },
    );

    expect(snapshot.files[0]).toMatchObject({
      path: "package.json",
      kind: "manifest",
    });
  });

  it("fetches GitLab snapshots", async () => {
    const fetchFn = vi.fn<typeof fetch>(async (url) => {
      const requestUrl = String(url);

      if (
        requestUrl.includes("/api/v4/projects/") &&
        !requestUrl.includes("/repository/")
      ) {
        return jsonResponse({
          path: "retrograde",
          path_with_namespace: "rivalize/retrograde",
          default_branch: "main",
          web_url: "https://gitlab.com/rivalize/retrograde",
          visibility: "public",
          description: null,
        });
      }

      if (requestUrl.includes("/repository/tree")) {
        return jsonResponse([{ path: "SECURITY.md", type: "blob" }]);
      }

      return new Response("policy", { status: 200 });
    });

    const snapshot = await new GitLabRepositoryProvider().fetchSnapshot(
      parseRepoLocator("https://gitlab.com/rivalize/retrograde"),
      {
        fetchFn,
        maxFiles: 10,
        maxFileSizeBytes: 100_000,
      },
    );

    expect(snapshot.files[0]).toMatchObject({ path: "SECURITY.md" });
  });

  it("fetches Bitbucket snapshots", async () => {
    const fetchFn = vi.fn<typeof fetch>(async (url) => {
      const requestUrl = String(url);

      if (requestUrl.endsWith("/repositories/rivalize/retrograde")) {
        return jsonResponse({
          name: "retrograde",
          full_name: "rivalize/retrograde",
          is_private: false,
          mainbranch: { name: "main" },
          links: {
            html: { href: "https://bitbucket.org/rivalize/retrograde" },
          },
          description: null,
        });
      }

      if (requestUrl.includes("/src/main/")) {
        return jsonResponse({
          values: [
            {
              path: "README.md",
              type: "commit_file",
              size: 6,
              links: { self: { href: "https://api.bitbucket.org/raw/readme" } },
            },
          ],
        });
      }

      return new Response("hello", { status: 200 });
    });

    const snapshot = await new BitbucketRepositoryProvider().fetchSnapshot(
      parseRepoLocator("https://bitbucket.org/rivalize/retrograde"),
      {
        fetchFn,
        maxFiles: 10,
        maxFileSizeBytes: 100_000,
      },
    );

    expect(snapshot.files[0]).toMatchObject({ path: "README.md" });
  });
});
