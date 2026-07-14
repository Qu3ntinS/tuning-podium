import { saveVehicleImage } from "../../lib/assets.js";
import type { Env } from "../../lib/env.js";

export type HttpOutcome<T> = {
  status: number;
  body: T;
};

export abstract class AdminAssetService {
  static async upload(config: Env, file: File): Promise<HttpOutcome<{ asset: { url: string; filename: string } } | { error: string }>> {
    try {
      const asset = await saveVehicleImage(config, file);
      return { status: 201, body: { asset } };
    } catch (error) {
      return {
        status: 400,
        body: {
          error: error instanceof Error ? error.message : "Upload fehlgeschlagen.",
        },
      };
    }
  }
}
