import { status } from "elysia";
import { clientIpFromRequest } from "../../lib/client-ip.js";
import type { Env } from "../../lib/env.js";
import { hashIp } from "../../lib/env.js";
import {
  createDeviceToken,
  deviceCookieHeader,
  isValidFingerprintHash,
  readDeviceToken,
} from "../../lib/device-session.js";
import { getEventBySlug, serializeEvent } from "../../lib/events.js";
import { prisma } from "../../lib/prisma.js";
import { validateVoteSubmission } from "../../lib/voting.js";
import { voteSelect } from "../shared/selects.js";
import type { VoteSubmitBody } from "./model.js";

export type HttpOutcome<T> = {
  status: number;
  body: T;
  cookie?: string;
};

async function resolveEvent(slug: string) {
  const event = await getEventBySlug(slug);
  if (!event) {
    return null;
  }
  return event;
}

async function findExistingVote(eventId: string, deviceToken: string, fingerprintHash?: string) {
  return prisma.vote.findFirst({
    where: {
      eventId,
      OR: [{ deviceToken }, ...(fingerprintHash ? [{ fingerprintHash }] : [])],
    },
    select: voteSelect,
  });
}

export abstract class VoteService {
  static async getSession(
    slug: string,
    request: Request,
    config: Env,
  ): Promise<HttpOutcome<{
    deviceToken: string;
    isNewDevice: boolean;
    hasVoted: boolean;
    vote: Awaited<ReturnType<typeof findExistingVote>>;
    event: ReturnType<typeof serializeEvent>;
  } | { error: string }>> {
    const event = await resolveEvent(slug);
    if (!event) {
      return { status: 404, body: { error: "Event nicht gefunden." } };
    }

    let deviceToken = readDeviceToken(request.headers.get("cookie"));
    let isNewDevice = false;
    let cookie: string | undefined;

    if (!deviceToken) {
      deviceToken = createDeviceToken();
      isNewDevice = true;
      cookie = deviceCookieHeader(deviceToken, config);
    }

    const vote = await prisma.vote.findFirst({
      where: { eventId: event.id, deviceToken },
      select: voteSelect,
    });

    return {
      status: 200,
      cookie,
      body: {
        deviceToken,
        isNewDevice,
        hasVoted: Boolean(vote),
        vote,
        event: serializeEvent(event),
      },
    };
  }

  static async submit(
    slug: string,
    body: VoteSubmitBody,
    request: Request,
    config: Env,
  ): Promise<HttpOutcome<{ vote: NonNullable<Awaited<ReturnType<typeof findExistingVote>>> } | { error: string; vote?: Awaited<ReturnType<typeof findExistingVote>> }>> {
    const event = await resolveEvent(slug);
    if (!event) {
      return { status: 404, body: { error: "Event nicht gefunden." } };
    }

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

    const existing = await findExistingVote(event.id, deviceToken, body.fingerprintHash);
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

    const activeVehicleCount =
      event.votingMode === "SWIPE"
        ? await prisma.vehicle.count({ where: { eventId: event.id, active: true } })
        : undefined;

    const { error, normalized } = validateVoteSubmission(event, {
      picks: body.picks,
      duels: body.duels,
      activeVehicleCount,
    });
    if (error) {
      return { status: 400, cookie, body: { error } };
    }

    if (event.votingMode === "SWIPE") {
      const activeVehicles = await prisma.vehicle.findMany({
        where: { eventId: event.id, active: true },
        select: { id: true },
      });
      const ratedIds = new Set((body.picks ?? []).map((pick) => pick.vehicleId));
      const missingActive = activeVehicles.some((vehicle) => !ratedIds.has(vehicle.id));
      const unknownRated = (body.picks ?? []).some(
        (pick) => !activeVehicles.some((vehicle) => vehicle.id === pick.vehicleId),
      );
      if (missingActive || unknownRated) {
        return {
          status: 400,
          cookie,
          body: { error: "Alle aktiven Fahrzeuge müssen genau einmal bewertet werden." },
        };
      }
    } else {
      const vehicleIds = normalized.map((p) => p.vehicleId);
      const vehicles = await prisma.vehicle.findMany({
        where: { id: { in: vehicleIds }, eventId: event.id, active: true },
        select: { id: true },
      });
      if (vehicles.length !== vehicleIds.length) {
        return { status: 400, cookie, body: { error: "Mindestens ein Fahrzeug ist ungültig oder inaktiv." } };
      }
    }

    const ip = clientIpFromRequest(request, config.trustProxy);
    const ipHash = hashIp(ip);
    const userAgent = request.headers.get("user-agent")?.slice(0, 255) ?? null;

    try {
      const vote = await prisma.vote.create({
        data: {
          eventId: event.id,
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
      const duplicate = await findExistingVote(event.id, deviceToken, body.fingerprintHash);
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
