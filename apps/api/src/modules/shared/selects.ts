import { vehiclePublicSelect } from "../../lib/vehicle-profile.js";

export const voteSelect = {
  id: true,
  createdAt: true,
  picks: {
    select: {
      rank: true,
      points: true,
      vehicle: {
        select: vehiclePublicSelect,
      },
    },
    orderBy: { rank: "asc" as const },
  },
} as const;
