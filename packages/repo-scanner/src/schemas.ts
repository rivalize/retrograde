import { z } from "zod";
import { ChainIdSchema, VulnerabilitySchema } from "@retrograde/scanner-core";

export const RepoProviderSchema = z.enum(["github", "gitlab", "bitbucket"]);
export const RepoFileKindSchema = z.enum([
  "source",
  "manifest",
  "workflow",
  "artifact",
  "config",
  "unknown",
]);

export const RepoLocatorSchema = z.object({
  provider: RepoProviderSchema,
  owner: z.string().min(1),
  repo: z.string().min(1),
  ref: z.string().min(1).optional(),
  webUrl: z.string().url(),
});

export const RepoMetadataSchema = z.object({
  provider: RepoProviderSchema,
  owner: z.string().min(1),
  repo: z.string().min(1),
  defaultBranch: z.string().min(1),
  webUrl: z.string().url(),
  isPrivate: z.boolean(),
  description: z.string().optional(),
});

export const RepoFileSchema = z.object({
  path: z.string().min(1),
  kind: RepoFileKindSchema,
  sizeBytes: z.number().int().nonnegative(),
  content: z.string(),
});

export const RepoSnapshotSchema = z.object({
  metadata: RepoMetadataSchema,
  files: z.array(RepoFileSchema),
});

export const RepoScannerOptionsSchema = z.object({
  chain: ChainIdSchema,
  target: z.string().min(1),
  ref: z.string().min(1).optional(),
  onChainBytecode: z
    .string()
    .regex(/^0x[0-9a-fA-F]*$/)
    .optional(),
  maxFiles: z.number().int().min(1).max(500).default(100),
  maxFileSizeBytes: z.number().int().min(1_024).max(2_000_000).default(250_000),
});

export const RepoAnalysisReportSchema = z.object({
  vulnerabilities: z.array(VulnerabilitySchema),
  metadata: z.record(z.unknown()),
});
