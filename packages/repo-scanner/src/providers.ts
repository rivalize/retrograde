import { RepoFetchError, UnsupportedRepoProviderError } from "./errors.js";
import {
  RepoFileSchema,
  RepoLocatorSchema,
  RepoMetadataSchema,
  RepoSnapshotSchema,
} from "./schemas.js";
import type {
  RepoFetchOptions,
  RepoFile,
  RepoFileKind,
  RepoLocator,
  RepoMetadata,
  RepoProvider,
  RepoSnapshot,
  RepositoryProvider,
} from "./types.js";
import { z } from "zod";

const GithubRepoResponseSchema = z.object({
  name: z.string(),
  full_name: z.string(),
  private: z.boolean(),
  html_url: z.string().url(),
  default_branch: z.string(),
  description: z.string().nullable(),
});

const GithubTreeResponseSchema = z.object({
  tree: z.array(
    z.object({
      path: z.string(),
      type: z.string(),
      size: z.number().int().nonnegative().optional(),
      url: z.string().url().optional(),
    }),
  ),
});

const GithubBlobResponseSchema = z.object({
  content: z.string(),
  encoding: z.literal("base64"),
});

const GitlabProjectResponseSchema = z.object({
  path: z.string(),
  path_with_namespace: z.string(),
  default_branch: z.string(),
  web_url: z.string().url(),
  visibility: z.string(),
  description: z.string().nullable(),
});

const GitlabTreeItemSchema = z.object({
  path: z.string(),
  type: z.string(),
});

const BitbucketRepoResponseSchema = z.object({
  name: z.string(),
  full_name: z.string(),
  is_private: z.boolean(),
  mainbranch: z
    .object({
      name: z.string(),
    })
    .optional(),
  links: z.object({
    html: z.object({
      href: z.string().url(),
    }),
  }),
  description: z.string().nullable(),
});

const BitbucketSrcResponseSchema = z.object({
  values: z.array(
    z.object({
      path: z.string(),
      type: z.string(),
      size: z.number().int().nonnegative().optional(),
      links: z
        .object({
          self: z.object({
            href: z.string().url(),
          }),
        })
        .optional(),
    }),
  ),
  next: z.string().url().optional(),
});

const TEXT_FILE_EXTENSIONS = new Set([
  ".sol",
  ".rs",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".toml",
  ".yaml",
  ".yml",
  ".md",
  ".env",
  ".example",
  ".lock",
]);

const IMPORTANT_FILE_NAMES = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "package-lock.json",
  "Cargo.toml",
  "Cargo.lock",
  "foundry.toml",
  "hardhat.config.ts",
  "hardhat.config.js",
  "SECURITY.md",
  ".env.example",
]);

/**
 * Parses a repository URL into a provider-specific locator.
 *
 * @param target - GitHub, GitLab, or Bitbucket repository URL.
 * @param ref - Optional branch, tag, or commit reference.
 * @returns Repository locator.
 */
export function parseRepoLocator(target: string, ref?: string): RepoLocator {
  const url = new URL(target);
  const [owner, repoSegment] = url.pathname.split("/").filter(Boolean);

  if (!owner || !repoSegment) {
    throw new UnsupportedRepoProviderError(target);
  }

  const repo = repoSegment.replace(/\.git$/, "");

  if (url.hostname === "github.com") {
    return RepoLocatorSchema.parse({
      provider: "github",
      owner,
      repo,
      ref,
      webUrl: `https://github.com/${owner}/${repo}`,
    });
  }

  if (url.hostname === "gitlab.com") {
    return RepoLocatorSchema.parse({
      provider: "gitlab",
      owner,
      repo,
      ref,
      webUrl: `https://gitlab.com/${owner}/${repo}`,
    });
  }

  if (url.hostname === "bitbucket.org") {
    return RepoLocatorSchema.parse({
      provider: "bitbucket",
      owner,
      repo,
      ref,
      webUrl: `https://bitbucket.org/${owner}/${repo}`,
    });
  }

  throw new UnsupportedRepoProviderError(target);
}

/**
 * Returns the repository provider implementation for a locator.
 *
 * @param provider - Repository provider id.
 * @returns Provider implementation.
 */
export function getRepositoryProvider(
  provider: RepoProvider,
): RepositoryProvider {
  switch (provider) {
    case "github":
      return new GitHubRepositoryProvider();
    case "gitlab":
      return new GitLabRepositoryProvider();
    case "bitbucket":
      return new BitbucketRepositoryProvider();
  }
}

export class GitHubRepositoryProvider implements RepositoryProvider {
  readonly provider = "github" as const;

  /**
   * Fetches a GitHub repository snapshot.
   *
   * @param locator - GitHub repository locator.
   * @param options - Fetch limits and fetch implementation.
   * @returns Repository snapshot.
   */
  async fetchSnapshot(
    locator: RepoLocator,
    options: RepoFetchOptions,
  ): Promise<RepoSnapshot> {
    const metadataResponse = await fetchJson(
      options.fetchFn,
      this.provider,
      `https://api.github.com/repos/${locator.owner}/${locator.repo}`,
    );
    const repo = GithubRepoResponseSchema.parse(metadataResponse);
    const defaultBranch = locator.ref ?? repo.default_branch;
    const treeResponse = await fetchJson(
      options.fetchFn,
      this.provider,
      `https://api.github.com/repos/${locator.owner}/${locator.repo}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
    );
    const tree = GithubTreeResponseSchema.parse(treeResponse);
    const metadata = RepoMetadataSchema.parse({
      provider: this.provider,
      owner: locator.owner,
      repo: locator.repo,
      defaultBranch,
      webUrl: repo.html_url,
      isPrivate: repo.private,
      description: repo.description ?? undefined,
    });
    const candidates = tree.tree
      .filter(
        (item) =>
          item.type === "blob" &&
          shouldFetchFile(item.path, item.size ?? 0, options.maxFileSizeBytes),
      )
      .slice(0, options.maxFiles);
    const files: RepoFile[] = [];

    for (const item of candidates) {
      if (!item.url) {
        continue;
      }

      const blobResponse = await fetchJson(
        options.fetchFn,
        this.provider,
        item.url,
      );
      const blob = GithubBlobResponseSchema.parse(blobResponse);
      const content = Buffer.from(
        blob.content.replace(/\s/g, ""),
        "base64",
      ).toString("utf8");
      files.push(
        RepoFileSchema.parse({
          path: item.path,
          kind: classifyRepoFile(item.path),
          sizeBytes: Buffer.byteLength(content),
          content,
        }),
      );
    }

    return RepoSnapshotSchema.parse({ metadata, files });
  }
}

export class GitLabRepositoryProvider implements RepositoryProvider {
  readonly provider = "gitlab" as const;

  /**
   * Fetches a GitLab repository snapshot.
   *
   * @param locator - GitLab repository locator.
   * @param options - Fetch limits and fetch implementation.
   * @returns Repository snapshot.
   */
  async fetchSnapshot(
    locator: RepoLocator,
    options: RepoFetchOptions,
  ): Promise<RepoSnapshot> {
    const projectId = encodeURIComponent(`${locator.owner}/${locator.repo}`);
    const projectResponse = await fetchJson(
      options.fetchFn,
      this.provider,
      `https://gitlab.com/api/v4/projects/${projectId}`,
    );
    const project = GitlabProjectResponseSchema.parse(projectResponse);
    const defaultBranch = locator.ref ?? project.default_branch;
    const treeResponse = await fetchJson(
      options.fetchFn,
      this.provider,
      `https://gitlab.com/api/v4/projects/${projectId}/repository/tree?recursive=true&per_page=${options.maxFiles}&ref=${encodeURIComponent(defaultBranch)}`,
    );
    const tree = z.array(GitlabTreeItemSchema).parse(treeResponse);
    const metadata = RepoMetadataSchema.parse({
      provider: this.provider,
      owner: locator.owner,
      repo: locator.repo,
      defaultBranch,
      webUrl: project.web_url,
      isPrivate: project.visibility !== "public",
      description: project.description ?? undefined,
    });
    const candidates = tree
      .filter(
        (item) =>
          item.type === "blob" &&
          shouldFetchFile(item.path, 0, options.maxFileSizeBytes),
      )
      .slice(0, options.maxFiles);
    const files: RepoFile[] = [];

    for (const item of candidates) {
      const rawUrl = `https://gitlab.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(item.path)}/raw?ref=${encodeURIComponent(defaultBranch)}`;
      const content = await fetchText(options.fetchFn, this.provider, rawUrl);

      if (Buffer.byteLength(content) > options.maxFileSizeBytes) {
        continue;
      }

      files.push(
        RepoFileSchema.parse({
          path: item.path,
          kind: classifyRepoFile(item.path),
          sizeBytes: Buffer.byteLength(content),
          content,
        }),
      );
    }

    return RepoSnapshotSchema.parse({ metadata, files });
  }
}

export class BitbucketRepositoryProvider implements RepositoryProvider {
  readonly provider = "bitbucket" as const;

  /**
   * Fetches a Bitbucket repository snapshot.
   *
   * @param locator - Bitbucket repository locator.
   * @param options - Fetch limits and fetch implementation.
   * @returns Repository snapshot.
   */
  async fetchSnapshot(
    locator: RepoLocator,
    options: RepoFetchOptions,
  ): Promise<RepoSnapshot> {
    const repoResponse = await fetchJson(
      options.fetchFn,
      this.provider,
      `https://api.bitbucket.org/2.0/repositories/${locator.owner}/${locator.repo}`,
    );
    const repo = BitbucketRepoResponseSchema.parse(repoResponse);
    const defaultBranch = locator.ref ?? repo.mainbranch?.name ?? "main";
    const metadata = RepoMetadataSchema.parse({
      provider: this.provider,
      owner: locator.owner,
      repo: locator.repo,
      defaultBranch,
      webUrl: repo.links.html.href,
      isPrivate: repo.is_private,
      description: repo.description ?? undefined,
    });
    const files: RepoFile[] = [];
    let nextUrl: string | undefined =
      `https://api.bitbucket.org/2.0/repositories/${locator.owner}/${locator.repo}/src/${encodeURIComponent(defaultBranch)}/?recursive=true&pagelen=100`;

    while (nextUrl && files.length < options.maxFiles) {
      const srcResponse = await fetchJson(
        options.fetchFn,
        this.provider,
        nextUrl,
      );
      const page = BitbucketSrcResponseSchema.parse(srcResponse);

      for (const item of page.values) {
        if (files.length >= options.maxFiles) {
          break;
        }

        if (
          item.type !== "commit_file" ||
          !shouldFetchFile(
            item.path,
            item.size ?? 0,
            options.maxFileSizeBytes,
          ) ||
          !item.links?.self.href
        ) {
          continue;
        }

        const content = await fetchText(
          options.fetchFn,
          this.provider,
          item.links.self.href,
        );

        if (Buffer.byteLength(content) > options.maxFileSizeBytes) {
          continue;
        }

        files.push(
          RepoFileSchema.parse({
            path: item.path,
            kind: classifyRepoFile(item.path),
            sizeBytes: Buffer.byteLength(content),
            content,
          }),
        );
      }

      nextUrl = page.next;
    }

    return RepoSnapshotSchema.parse({ metadata, files });
  }
}

/**
 * Classifies a repository file by path.
 *
 * @param path - Repository-relative path.
 * @returns File kind used by analyzers.
 */
export function classifyRepoFile(path: string): RepoFileKind {
  const lowerPath = path.toLowerCase();

  if (
    lowerPath.endsWith(".sol") ||
    lowerPath.endsWith(".rs") ||
    lowerPath.endsWith(".ts") ||
    lowerPath.endsWith(".js")
  ) {
    return "source";
  }

  if (
    lowerPath.endsWith("package.json") ||
    lowerPath.endsWith("cargo.toml") ||
    lowerPath.endsWith(".lock")
  ) {
    return "manifest";
  }

  if (
    lowerPath.startsWith(".github/workflows/") ||
    lowerPath.includes("/.github/workflows/") ||
    lowerPath.includes("gitlab-ci")
  ) {
    return "workflow";
  }

  if (
    lowerPath.endsWith(".json") &&
    (lowerPath.includes("artifacts/") ||
      lowerPath.includes("build-info/") ||
      lowerPath.includes("target/"))
  ) {
    return "artifact";
  }

  if (
    lowerPath.endsWith(".toml") ||
    lowerPath.endsWith(".yaml") ||
    lowerPath.endsWith(".yml") ||
    lowerPath.endsWith(".env.example")
  ) {
    return "config";
  }

  return "unknown";
}

async function fetchJson(
  fetchFn: typeof fetch,
  provider: string,
  url: string,
): Promise<unknown> {
  const response = await fetchFn(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new RepoFetchError(provider, response.status, url);
  }

  return response.json();
}

async function fetchText(
  fetchFn: typeof fetch,
  provider: string,
  url: string,
): Promise<string> {
  const response = await fetchFn(url, {
    headers: {
      accept: "text/plain,application/octet-stream,*/*",
    },
  });

  if (!response.ok) {
    throw new RepoFetchError(provider, response.status, url);
  }

  return response.text();
}

function shouldFetchFile(
  path: string,
  sizeBytes: number,
  maxFileSizeBytes: number,
): boolean {
  if (sizeBytes > maxFileSizeBytes) {
    return false;
  }

  const fileName = path.split("/").at(-1) ?? path;

  if (IMPORTANT_FILE_NAMES.has(fileName)) {
    return true;
  }

  const lowerPath = path.toLowerCase();
  return Array.from(TEXT_FILE_EXTENSIONS).some((extension) =>
    lowerPath.endsWith(extension),
  );
}
