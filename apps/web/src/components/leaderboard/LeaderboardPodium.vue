<script setup lang="ts">
import { computed } from "vue";
import { assetUrl, type LeaderboardEntry } from "@/lib/api";
import { vehicleDisplayName, vehicleColorClass, vehicleShortLabel } from "@/lib/vehicle-visual";
import { cn } from "@/lib/utils";

const props = defineProps<{
  entries: LeaderboardEntry[];
}>();

const PODIUM_ORDER = [
  { index: 1, pedestal: "h-24 sm:h-28", glow: "leaderboard-podium-glow-2", medal: "accent-violet-text" },
  { index: 0, pedestal: "h-32 sm:h-36", glow: "leaderboard-podium-glow-1", medal: "accent-cool-text" },
  { index: 2, pedestal: "h-20 sm:h-24", glow: "leaderboard-podium-glow-3", medal: "accent-mint-text" },
] as const;

const podium = computed(() => props.entries.slice(0, 3));
</script>

<template>
  <section v-if="podium.length > 0" class="leaderboard-podium">
    <div class="mb-4 flex items-end justify-between gap-3">
      <h2 class="panel-title">Podium</h2>
      <span class="stat-pill">Top 3</span>
    </div>

    <div class="grid grid-cols-3 items-end gap-2 sm:gap-4">
      <div
        v-for="slot in PODIUM_ORDER"
        :key="slot.index"
        :class="cn('flex flex-col items-center', slot.index === 0 ? 'order-2 sm:order-2' : slot.index === 1 ? 'order-1 sm:order-1' : 'order-3')"
      >
        <template v-if="podium[slot.index]">
          <div class="leaderboard-podium-card mb-3 w-full px-1 sm:px-2">
            <div class="relative mx-auto size-16 overflow-hidden rounded-2xl shadow-2xl sm:size-20">
              <img
                v-if="assetUrl(podium[slot.index]!.vehicle.imageUrl)"
                :src="assetUrl(podium[slot.index]!.vehicle.imageUrl)!"
                :alt="podium[slot.index]!.vehicle.name"
                class="size-full object-cover"
              />
              <div
                v-else
                :class="
                  cn(
                    'flex size-full items-center justify-center font-heading text-lg font-semibold text-white/95',
                    vehicleColorClass(podium[slot.index]!.vehicle.id),
                  )
                "
              >
                {{ vehicleShortLabel(podium[slot.index]!.vehicle) }}
              </div>
            </div>

            <p class="mt-2.5 line-clamp-2 text-center text-[11px] font-medium leading-tight sm:text-xs">
              {{ vehicleDisplayName(podium[slot.index]!.vehicle) }}
            </p>

            <p
              class="mt-1 text-center font-heading text-xl font-semibold tabular-nums sm:text-2xl"
              :class="slot.medal"
            >
              {{ podium[slot.index]!.totalPoints }}
            </p>
            <p class="text-center text-[10px] text-muted-foreground">{{ podium[slot.index]!.voteCount }} Stimmen</p>
          </div>

          <div :class="cn('leaderboard-pedestal w-full rounded-t-2xl', slot.pedestal, slot.glow)">
            <span :class="cn('font-heading text-2xl font-bold sm:text-3xl', slot.medal)">
              {{ slot.index + 1 }}
            </span>
          </div>
        </template>

        <div
          v-else
          :class="cn('leaderboard-pedestal-empty flex w-full items-center justify-center rounded-t-2xl text-xs text-muted-foreground', slot.pedestal)"
        >
          —
        </div>
      </div>
    </div>
  </section>
</template>
