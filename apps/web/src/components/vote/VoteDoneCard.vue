<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { CheckIcon, InfoIcon, TrophyIcon } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import VehicleDetailSheet from "@/components/vote/VehicleDetailSheet.vue";
import VoteDonePodium from "@/components/vote/VoteDonePodium.vue";
import { assetUrl, type EventConfig, type VotePick, type VotingMode } from "@/lib/api";
import {
  rankAccentClass,
  RANK_META,
  vehicleColorClass,
  vehicleDisplayName,
  vehicleShortLabel,
} from "@/lib/vehicle-visual";
import { hasVehicleProfile } from "@/lib/vehicle-profile";
import { VOTING_MODE_META } from "@/lib/voting-modes";
import { cn } from "@/lib/utils";

const props = defineProps<{
  picks: VotePick[];
  votingMode: VotingMode;
  config: EventConfig;
}>();

const profileVehicle = ref<VotePick["vehicle"] | null>(null);
const profileOpen = ref(false);

const sortedPicks = computed(() => [...props.picks].sort((a, b) => a.rank - b.rank));

const totalPoints = computed(() =>
  props.picks.reduce((sum, pick) => sum + pick.points, 0),
);

const summaryTitle = computed(() => {
  if (props.votingMode === "COINS") return "Deine Verteilung";
  if (props.votingMode === "SWIPE") return "Deine Likes";
  if (props.votingMode === "DUEL") return "Deine Favoriten";
  return "Deine Favoriten";
});

const countLabel = computed(() => {
  if (props.votingMode === "SWIPE") return `${props.picks.length} Likes`;
  if (props.votingMode === "DUEL") return `${props.picks.length} Fahrzeuge`;
  if (props.votingMode === "COINS") return `${totalPoints.value} Punkte`;
  return "Top 3";
});

const showPodium = computed(() => props.votingMode === "PODIUM" && props.picks.length <= 3);

function rankMeta(rank: number) {
  return RANK_META.find((meta) => meta.rank === rank);
}

function pointsLabel(pick: VotePick) {
  if (props.votingMode === "COINS") return "Punkte";
  if (props.votingMode === "SWIPE") return "Like";
  if (props.votingMode === "DUEL") return pick.points === 1 ? "Sieg" : "Siege";
  return pick.points === 1 ? "Sieg" : "Siege";
}

function rowToneClass(rank: number) {
  if (rank === 1) return "vote-done-row-top";
  if (rank === 2) return "vote-done-row-second";
  if (rank === 3) return "vote-done-row-third";
  return "";
}

function showRankEmoji(rank: number) {
  return rank <= 3;
}

function openProfile(vehicle: VotePick["vehicle"]) {
  profileVehicle.value = vehicle;
  profileOpen.value = true;
}
</script>

<template>
  <div :class="cn('vote-done', !showPodium && 'vote-done-has-list')">
    <header class="vote-done-success animate-fade-up">
      <div class="vote-done-success-icon" aria-hidden="true">
        <CheckIcon class="size-5 sm:size-6" />
      </div>
      <h3 class="vote-done-success-title">Stimme gespeichert</h3>
      <p class="vote-done-success-subtitle">In der Live-Rangliste sichtbar</p>
      <div class="vote-done-success-meta">
        <span class="stat-pill stat-pill-cool">{{ VOTING_MODE_META[votingMode].label }}</span>
        <span class="stat-pill">{{ countLabel }}</span>
      </div>
    </header>

    <section
      :class="
        cn(
          'vote-done-body animate-fade-up',
          showPodium && 'vote-done-body-podium',
          !showPodium && 'vote-done-body-list',
        )
      "
    >
      <div v-if="!showPodium" class="vote-done-podium-head">
        <h4 class="vote-done-body-title">{{ summaryTitle }}</h4>
        <span class="stat-pill tabular-nums">{{ sortedPicks.length }}</span>
      </div>

      <VoteDonePodium
        v-if="showPodium"
        :picks="sortedPicks"
        @info="openProfile"
      />

      <div v-else class="vote-done-rows animate-stagger">
        <article
          v-for="pick in sortedPicks"
          :key="`${pick.vehicle.id}-${pick.rank}`"
          :class="cn('vote-done-row', rowToneClass(pick.rank))"
        >
          <div
            :class="
              cn(
                'vote-done-row-rank',
                showRankEmoji(pick.rank) ? rankMeta(pick.rank)?.badgeClass : '',
              )
            "
          >
            <span v-if="showRankEmoji(pick.rank)" class="text-sm leading-none">
              {{ rankMeta(pick.rank)?.emoji }}
            </span>
            <span v-else class="font-heading text-xs font-semibold tabular-nums" :class="rankAccentClass(pick.rank)">
              {{ pick.rank }}
            </span>
          </div>

          <div class="vote-done-row-thumb">
            <img
              v-if="assetUrl(pick.vehicle.imageUrl)"
              :src="assetUrl(pick.vehicle.imageUrl)!"
              :alt="pick.vehicle.name"
              class="size-full object-cover"
            />
            <div
              v-else
              :class="
                cn(
                  'flex size-full items-center justify-center text-sm font-bold text-white/95',
                  vehicleColorClass(pick.vehicle.id),
                )
              "
            >
              {{ vehicleShortLabel(pick.vehicle) }}
            </div>
          </div>

          <div class="vote-done-row-copy">
            <p class="vote-done-row-name">{{ vehicleDisplayName(pick.vehicle) }}</p>
            <p class="vote-done-row-meta">#{{ pick.rank }} · {{ pointsLabel(pick) }}</p>
          </div>

          <div class="vote-done-score-pill" :class="rankAccentClass(pick.rank)">
            <span class="vote-done-score-value">{{ pick.points }}</span>
            <span class="vote-done-score-unit">Pkt</span>
          </div>

          <Button
            v-if="hasVehicleProfile(pick.vehicle)"
            type="button"
            variant="ghost"
            size="icon-sm"
            class="vote-done-row-info shrink-0"
            aria-label="Profil ansehen"
            @click="openProfile(pick.vehicle)"
          >
            <InfoIcon class="size-4" />
          </Button>
        </article>
      </div>
    </section>

    <VehicleDetailSheet v-model:open="profileOpen" :vehicle="profileVehicle" />

    <footer :class="cn('vote-done-cta-bar', !showPodium && 'vote-done-cta-bar-flow')">
      <RouterLink to="/leaderboard" class="block w-full sm:w-auto">
        <Button class="vote-done-cta cta-button w-full sm:min-w-[15rem]">
          <TrophyIcon class="size-4" />
          Zur Rangliste
        </Button>
      </RouterLink>
    </footer>
  </div>
</template>
