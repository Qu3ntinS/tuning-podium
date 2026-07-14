import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { Env } from "./env.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export async function saveVehicleImage(
  config: Env,
  file: File,
): Promise<{ url: string; filename: string }> {
  if (!file || file.size === 0) {
    throw new Error("Keine Datei hochgeladen.");
  }

  if (file.size > config.maxUploadBytes) {
    throw new Error(`Datei zu groß (max. ${Math.round(config.maxUploadBytes / 1024 / 1024)} MB).`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectImageMime(buffer);
  if (!detectedMime || !ALLOWED_MIME.has(detectedMime)) {
    throw new Error("Nur JPEG, PNG oder WebP erlaubt.");
  }

  const extension = MIME_EXTENSION[detectedMime];
  if (!extension) {
    throw new Error("Dateityp nicht unterstützt.");
  }

  const vehiclesDir = path.join(config.uploadDir, "vehicles");
  await mkdir(vehiclesDir, { recursive: true });

  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${extension}`;
  const absolutePath = path.join(vehiclesDir, filename);
  await writeFile(absolutePath, buffer);

  const url = `${config.publicAssetsPath}/vehicles/${filename}`;
  return { url, filename };
}

export function resolveUploadRoot(config: Env): string {
  return path.resolve(config.uploadDir);
}
