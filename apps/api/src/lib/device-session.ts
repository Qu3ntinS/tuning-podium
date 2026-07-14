import { randomUUID } from "node:crypto";
import type { Env } from "./env.js";

export const DEVICE_COOKIE = "podium_device";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function readDeviceToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${DEVICE_COOKIE}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function createDeviceToken(): string {
  return randomUUID();
}

export function deviceCookieHeader(token: string, config: Env): string {
  const secure = config.nodeEnv === "production" ? "; Secure" : "";
  return `${DEVICE_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DEVICE_COOKIE_MAX_AGE}${secure}`;
}

export function isValidFingerprintHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}
