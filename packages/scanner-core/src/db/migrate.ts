import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { z } from "zod";
import { createLogger } from "../logger.js";

const DatabaseUrlSchema = z.string().url();
const logger = createLogger({ name: "scanner-core-migrate" });

/**
 * Runs scanner-core PostgreSQL migrations in filename order.
 *
 * @param databaseUrl - PostgreSQL connection string.
 * @returns Resolves after all migrations are applied.
 */
export async function runMigrations(
  databaseUrl = process.env.DATABASE_URL,
): Promise<void> {
  const parsedDatabaseUrl = DatabaseUrlSchema.parse(databaseUrl);
  const client = new Client({ connectionString: parsedDatabaseUrl });
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const migrationsDir = join(currentDir, "../../migrations");

  await client.connect();

  try {
    const migrationFiles = (await readdir(migrationsDir))
      .filter((fileName) => fileName.endsWith(".sql"))
      .sort();

    for (const fileName of migrationFiles) {
      const sql = await readFile(join(migrationsDir, fileName), "utf8");
      await client.query(sql);
      logger.info({ fileName }, "migration applied");
    }
  } finally {
    await client.end();
  }
}

await runMigrations();
