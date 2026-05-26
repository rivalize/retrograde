import pino, { type LoggerOptions } from "pino";
import { z } from "zod";

const LogLevelSchema = z
  .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
  .default("info");

/**
 * Creates a structured pino logger for scanner-core.
 *
 * @param options - Optional pino logger configuration.
 * @returns Configured pino logger instance.
 */
export function createLogger(options: LoggerOptions = {}) {
  const level = LogLevelSchema.parse(process.env.LOG_LEVEL ?? "info");

  return pino({
    level,
    name: "scanner-core",
    ...options,
  });
}
