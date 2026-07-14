<script setup lang="ts">
import { computed } from "vue";
import { InfoIcon } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { assetUrl, type VotePick } from "@/lib/api";
import { hasVehicleProfile } from "@/lib/vehicle-profile";
import {
  RANK_META,
  vehicleColorClass,
  vehicleDisplayName,
  vehicleShortLabel,
} from "@/lib/vehicle-visual";
import { cn } from "@/lib/utils";

const props = defineProps<{
  picks: VotePick[];
}>();

const emit = defineEmits<{
  info: [vehicle: VotePick["vehicle"]];
}>();

const PODIUM_LAYOUT = [
  {
    rank: 2,
    pedestal: "h-24 sm:h-28",
    glow: "leaderboard-podium-glow-2",
    accent: "accent-violet-text",
    tone: "rank-surface-2",
    ring: "rank-ring-2",
    image: "vote-done-podium-image-2",
  },
  {
    rank: 1,
    pedestal: "h-32 sm:h-36",
    glow: "leaderboard-podium-glow-1",
    accent: "accent-cool-text",
    tone: "rank-surface-1",
    ring: "rank-ring-1",
    image: "vote-done-podium-image-1",
  },
  {
    rank: 3,
    pedestal: "h-20 sm:h-24",
    glow: "leaderboard-podium-glow-3",
    accent: "accent-mint-text",
    tone: "rank-surface-3",
    ring: "rank-ring-3",
    image: "vote-done-podium-image-3",
  },
] as const;

const pickByRank = computed(() => new Map(props.picks.map((pick) => [pick.rank, pick])));

function rankMeta(rank: number) {
  return RANK_META.find((meta) => meta.rank === rank);
}

function pickFor(rank: number) {
  return pickByRank.value.get(rank);
}
</script>

<template>
  <div class="vote-done-podium">
    <div class="vote-done-podium-head">
      <h4 class="vote-done-body-title">Dein Podium</h4>
      <span class="stat-pill">Top 3</span>
    </div>

    <div class="vote-done-podium-stage animate-stagger">
      <div
        v-for="slot in PODIUM_LAYOUT"
        :key="slot.rank"
        :class="cn('vote-done-podium-slot', slot.rank === 1 && 'vote-done-podium-slot-winner')"
      >
        <template v-if="pickFor(slot.rank)">
          <article :class="cn('vote-done-podium-card', slot.tone)">
            <div :class="cn('vote-done-podium-image', slot.image, slot.ring)">
              <img
                v-if="assetUrl(pickFor(slot.rank)!.vehicle.imageUrl)"
                :src="assetUrl(pickFor(slot.rank)!.vehicle.imageUrl)!"
                :alt="pickFor(slot.rank)!.vehicle.name"
                class="size-full object-cover"
              />
              <div
                v-else
                :class="
                  cn(
                    'flex size-full items-center justify-center font-heading font-semibold text-white/95',
                    vehicleColorClass(pickFor(slot.rank)!.vehicle.id),
                    slot.rank === 1 ? 'text-xl sm:text-2xl' : 'text-lg',
                  )
                "
              >
                {{ vehicleShortLabel(pickFor(slot.rank)!.vehicle) }}
              </div>

              <Button
                v-if="hasVehicleProfile(pickFor(slot.rank)!.vehicle)"
                type="button"
                variant="secondary"
                size="icon-sm"
                class="vote-done-podium-info"
                aria-label="Profil ansehen"
                @click="emit('info', pickFor(slot.rank)!.vehicle)"
              >
                <InfoIcon class="size-3.5" />
              </Button>
            </div>

            <p class="vote-done-podium-name">
              {{ vehicleDisplayName(pickFor(slot.rank)!.vehicle) }}
            </p>
          </article>

          <div :class="cn('leaderboard-pedestal vote-done-podium-pedestal w-full', slot.pedestal, slot.glow)">
            <div class="vote-done-podium-pedestal-copy">
              <span class="text-base leading-none sm:text-lg">{{ rankMeta(slot.rank)?.emoji }}</span>
              <span :class="cn('font-heading text-xl font-bold tabular-nums sm:text-2xl', slot.accent)">
                {{ pickFor(slot.rank)!.points }}
              </span>
              <span class="vote-done-podium-pedestal-label">Pkt</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
