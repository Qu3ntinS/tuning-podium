<script setup lang="ts">
import { computed } from "vue";
import { assetUrl, type LeaderboardEntry } from "@/lib/api";
import { vehicleDisplayName, vehicleColorClass, vehicleShortLabel } from "@/lib/vehicle-visual";
import { cn } from "@/lib/utils";

const props = defineProps<{
  entries: LeaderboardEntry[];
}>();

const maxPoints = computed(() =>
  Math.max(1, ...props.entries.map((entry) => entry.totalPoints)),
);

const chartEntries = computed(() => props.entries);

const barTone = (index: number) => {
  if (index === 0) return "bar-rank-1 progress-fill-glow-cool";
  if (index === 1) return "bar-rank-2 progress-fill-glow-violet";
  if (index === 2) return "bar-rank-3 progress-fill-glow-mint";
  return "bar-neutral";
};

const pointsAccent = (index: number) => {
  if (index === 0) return "accent-cool-text";
  if (index === 1) return "accent-violet-text";
  if (index === 2) return "accent-mint-text";
  return "text-foreground";
};

const rankBadgeAccent = (index: number) => {
  if (index === 0) return "rank-badge-1";
  if (index === 1) return "rank-badge-2";
  if (index === 2) return "rank-badge-3";
  return "bg-foreground/5 text-foreground/80";
};
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-end justify-between gap-3">
      <div>
        <h2 class="panel-title sm:text-base">Punkteverteilung</h2>
        <p class="panel-description">Relativ zum Führenden</p>
      </div>
      <span class="stat-pill tabular-nums">{{ entries.length }} Fahrzeuge</span>
    </div>

    <div class="flex flex-col gap-3 sm:gap-3.5">
      <div
        v-for="(entry, index) in chartEntries"
        :key="entry.vehicle.id"
        class="leaderboard-chart-row group"
        :style="{ animationDelay: `${index * 45}ms` }"
      >
        <div class="flex items-center gap-3">
          <span
            :class="
              cn(
                'flex size-7 shrink-0 items-center justify-center rounded-lg font-heading text-xs font-semibold tabular-nums sm:size-8 sm:text-sm',
                rankBadgeAccent(index),
              )
            "
          >
            {{ index + 1 }}
          </span>

          <div class="size-9 shrink-0 overflow-hidden rounded-lg shadow-md sm:size-10">
            <img
              v-if="assetUrl(entry.vehicle.imageUrl)"
              :src="assetUrl(entry.vehicle.imageUrl)!"
              :alt="entry.vehicle.name"
              class="size-full object-cover"
            />
            <div
              v-else
              :class="
                cn(
                  'flex size-full items-center justify-center text-[10px] font-bold text-white/95',
                  vehicleColorClass(entry.vehicle.id),
                )
              "
            >
              {{ vehicleShortLabel(entry.vehicle) }}
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <div class="mb-1.5 flex items-baseline justify-between gap-2">
              <p class="truncate text-sm font-medium">{{ vehicleDisplayName(entry.vehicle) }}</p>
              <p
                class="shrink-0 font-heading text-sm font-semibold tabular-nums sm:text-base"
                :class="pointsAccent(index)"
              >
                {{ entry.totalPoints }}
              </p>
            </div>

            <div class="progress-track">
              <div
                class="progress-fill"
                :class="barTone(index)"
                :style="{ width: `${(entry.totalPoints / maxPoints) * 100}%` }"
              />
            </div>

            <p class="mt-1 text-[11px] text-muted-foreground">{{ entry.voteCount }} Stimmen</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
