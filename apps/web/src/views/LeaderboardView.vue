<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { toast } from "@/lib/toast";
import LeaderboardChart from "@/components/leaderboard/LeaderboardChart.vue";
import LeaderboardPodium from "@/components/leaderboard/LeaderboardPodium.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
import SurfaceCard from "@/components/layout/SurfaceCard.vue";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageSync } from "@/composables/usePageSync";
import { useActiveEventSlug } from "@/composables/useActiveEvent";
import { fetchLeaderboard, type LeaderboardEntry, type VotingMode } from "@/lib/api";
import { votingModeLabel } from "@/lib/voting-modes";
import { cn } from "@/lib/utils";

const props = defineProps<{
  slug: string;
}>();

const { setActiveEventSlug } = useActiveEventSlug();

const loading = ref(true);
const entries = ref<LeaderboardEntry[]>([]);
const totalVotes = ref(0);
const votingMode = ref<VotingMode>("PODIUM");
const eventName = ref("");
const updatedAt = ref<string | null>(null);

const headerStats = computed(() => {
  const stats = [`${totalVotes.value} Stimmen`, votingModeLabel(votingMode.value)];
  if (updatedAt.value) {
    stats.push(`Aktualisiert ${new Date(updatedAt.value).toLocaleTimeString("de-DE")}`);
  }
  return stats;
});

async function loadLeaderboard(silent = false) {
  try {
    const data = await fetchLeaderboard(props.slug);
    entries.value = data.entries;
    totalVotes.value = data.totalVotes;
    votingMode.value = data.votingMode;
    eventName.value = data.event.name;
    updatedAt.value = data.updatedAt;
  } catch (error) {
    if (!silent) {
      toast.error(error instanceof Error ? error.message : "Rangliste konnte nicht geladen werden.");
    }
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.slug,
  (slug) => {
    setActiveEventSlug(slug);
    loading.value = true;
    void loadLeaderboard();
  },
  { immediate: true },
);

usePageSync({
  slug: () => props.slug,
  intervalMs: 8_000,
  onRefresh: () => loadLeaderboard(true),
});
</script>

<template>
  <div class="app-page">
    <PageHeader eyebrow="Live" :title="eventName || 'Rangliste'">
      <template #description>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="(stat, index) in headerStats" :key="index" :class="cn('stat-pill', index === 0 && 'stat-pill-cool', index === 1 && 'stat-pill-violet')">
            {{ stat }}
          </span>
        </div>
      </template>
    </PageHeader>

    <SurfaceCard v-if="loading">
      <div class="flex flex-col gap-3">
        <Skeleton class="h-8 w-40 rounded-lg" />
        <Skeleton class="h-40 w-full rounded-xl" />
        <Skeleton class="h-28 w-full rounded-xl" />
      </div>
    </SurfaceCard>

    <SurfaceCard v-else-if="entries.length === 0" content-class="vote-empty-state">
      Keine Stimmen vorhanden.
    </SurfaceCard>

    <template v-else>
      <SurfaceCard>
        <LeaderboardPodium :entries="entries" />
      </SurfaceCard>

      <SurfaceCard>
        <LeaderboardChart :entries="entries" />
      </SurfaceCard>
    </template>
  </div>
</template>
