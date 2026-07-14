import { clientIpFromRequest } from "../../lib/client-ip.js";
import type { Env } from "../../lib/env.js";
import { hashIp } from "../../lib/env.js";
import {
  createDeviceToken,
  deviceCookieHeader,
  isValidFingerprintHash,
  readDeviceToken,
} from "../../lib/device-session.js";
import { getEventConfig, serializeEventConfig } from "../../lib/event-config.js";
import { prisma } from "../../lib/prisma.js";
import { validateVoteSubmission } from "../../lib/voting.js";
import { voteSelect } from "../shared/selects.js";
import type { VoteSubmitBody } from "./model.js";

export type HttpOutcome<T> = {
  status: number;
  body: T;
  cookie?: string;
};

async function findExistingVote(deviceToken: string, fingerprintHash?: string) {
  return prisma.vote.findFirst({
    where: {
      OR: [{ deviceToken }, ...(fingerprintHash ? [{ fingerprintHash }] : [])],
    },
    select: voteSelect,
  });
}

export abstract class VoteService {
  static async getSession(request: Request, config: Env): Promise<HttpOutcome<{
    deviceToken: string;
    isNewDevice: boolean;
    hasVoted: boolean;
    vote: Awaited<ReturnType<typeof findExistingVote>>;
    config: ReturnType<typeof serializeEventConfig>;
  }>> {
    let deviceToken = readDeviceToken(request.headers.get("cookie"));
    let isNewDevice = false;
    let cookie: string | undefined;

    if (!deviceToken) {
      deviceToken = createDeviceToken();
      isNewDevice = true;
      cookie = deviceCookieHeader(deviceToken, config);
    }

    const [eventConfig, vote] = await Promise.all([
      getEventConfig(),
      prisma.vote.findUnique({
        where: { deviceToken },
        select: voteSelect,
      }),
    ]);

    return {
      status: 200,
      cookie,
      body: {
        deviceToken,
        isNewDevice,
        hasVoted: Boolean(vote),
        vote,
        config: serializeEventConfig(eventConfig),
      },
    };
  }

  static async submit(
    body: VoteSubmitBody,
    request: Request,
    config: Env,
  ): Promise<HttpOutcome<{ vote: NonNullable<Awaited<ReturnType<typeof findExistingVote>>> } | { error: string; vote?: Awaited<ReturnType<typeof findExistingVote>> }>> {
    if (!isValidFingerprintHash(body.fingerprintHash)) {
      return { status: 400, body: { error: "Ungültiges Geräteprofil." } };
    }

    const cookieToken = readDeviceToken(request.headers.get("cookie"));
    const deviceToken = cookieToken ?? body.deviceToken;
    if (!deviceToken) {
      return { status: 400, body: { error: "Keine Gerätesitzung. Seite bitte neu laden." } };
    }

    if (cookieToken && body.deviceToken && cookieToken !== body.deviceToken) {
      return { status: 403, body: { error: "Gerätesitzung ungültig." } };
    }

    const cookie = !cookieToken ? deviceCookieHeader(deviceToken, config) : undefined;

    const existing = await findExistingVote(deviceToken, body.fingerprintHash);
    if (existing) {
      return {
        status: 409,
        cookie,
        body: {
          error: "Du hast bereits abgestimmt.",
          vote: existing,
        },
      };
    }

    const eventConfig = await getEventConfig();
    const { error, normalized } = validateVoteSubmission(eventConfig, {
      picks: body.picks,
      duels: body.duels,
    });
    if (error) {
      return { status: 400, cookie, body: { error } };
    }

    const vehicleIds = normalized.map((p) => p.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds }, active: true },
      select: { id: true },
    });
    if (vehicles.length !== vehicleIds.length) {
      return { status: 400, cookie, body: { error: "Mindestens ein Fahrzeug ist ungültig oder inaktiv." } };
    }

    const ip = clientIpFromRequest(request, config.trustProxy);
    const ipHash = hashIp(ip);
    const userAgent = request.headers.get("user-agent")?.slice(0, 255) ?? null;

    try {
      const vote = await prisma.vote.create({
        data: {
          deviceToken,
          fingerprintHash: body.fingerprintHash,
          ipHash,
          userAgent,
          picks: {
            create: normalized.map((pick) => ({
              vehicleId: pick.vehicleId,
              rank: pick.rank,
              points: pick.points,
            })),
          },
        },
        select: voteSelect,
      });

      return { status: 201, cookie, body: { vote } };
    } catch {
      const duplicate = await findExistingVote(deviceToken, body.fingerprintHash);
      if (duplicate) {
        return {
          status: 409,
          cookie,
          body: { error: "Du hast bereits abgestimmt.", vote: duplicate },
        };
      }
      return { status: 409, cookie, body: { error: "Abstimmung fehlgeschlagen." } };
    }
  }
}
