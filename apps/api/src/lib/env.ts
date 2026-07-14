import { createHash } from "node:crypto";

type NodeEnv = "development" | "production" | "test";

export type Env = {
  nodeEnv: NodeEnv;
  databaseUrl: string;
  port: number;
  trustProxy: boolean;
  corsOrigin: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  uploadDir: string;
  publicAssetsPath: string;
  maxUploadBytes: number;
  voteRateLimitMax: number;
  voteRateLimitWindowMs: number;
  publicAppUrl: string;
};

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  throw new Error(`Invalid boolean: ${raw}`);
}

function parseIntRequired(raw: string | undefined, name: string, fallback: number): number {
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid integer for ${name}: ${raw}`);
  }
  return value;
}

export function loadEnv(): Env {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as NodeEnv;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET is required (min 32 characters)");
  }

  return {
    nodeEnv,
    databaseUrl,
    port: parseIntRequired(process.env.PORT, "PORT", 3001),
    trustProxy: parseBool(process.env.TRUST_PROXY, nodeEnv === "production"),
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
    uploadDir: process.env.UPLOAD_DIR ?? "./data/uploads",
    publicAssetsPath: process.env.PUBLIC_ASSETS_PATH ?? "/assets",
    maxUploadBytes: parseIntRequired(process.env.MAX_UPLOAD_BYTES, "MAX_UPLOAD_BYTES", 5 * 1024 * 1024),
  voteRateLimitMax: parseIntRequired(process.env.VOTE_RATE_LIMIT_MAX, "VOTE_RATE_LIMIT_MAX", 5),
  voteRateLimitWindowMs: parseIntRequired(
    process.env.VOTE_RATE_LIMIT_WINDOW_MS,
    "VOTE_RATE_LIMIT_WINDOW_MS",
    86_400_000,
  ),
  publicAppUrl: process.env.PUBLIC_APP_URL ?? "http://localhost:5173",
};
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
