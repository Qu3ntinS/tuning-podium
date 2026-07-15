<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { toast } from "@/lib/toast";
import PageHeader from "@/components/layout/PageHeader.vue";
import { Skeleton } from "@/components/ui/skeleton";
import VoteCoinsFlow from "@/components/vote/VoteCoinsFlow.vue";
import VoteDoneCard from "@/components/vote/VoteDoneCard.vue";
import VotePodiumFlow from "@/components/vote/VotePodiumFlow.vue";
import VoteDuelFlow from "@/components/vote/VoteDuelFlow.vue";
import VoteSwipeFlow from "@/components/vote/VoteSwipeFlow.vue";
import { useLiveRefresh } from "@/composables/useLiveRefresh";
import { useActiveEventSlug } from "@/composables/useActiveEvent";
import { createDeviceFingerprint } from "@/composables/useDeviceFingerprint";
import {
  fetchVoteSession,
  fetchVehicles,
  type PodiumEvent,
  type Vehicle,
  type VotePick,
} from "@/lib/api";
import { VOTING_MODE_META } from "@/lib/voting-modes";

const props = defineProps<{
  slug: string;
}>();

const { setActiveEventSlug } = useActiveEventSlug();

const step = ref<"vote" | "done">("vote");
const deviceToken = ref("");
const fingerprintHash = ref("");
const vehicles = ref<Vehicle[]>([]);
const eventConfig = ref<PodiumEvent | null>(null);
const loading = ref(true);
const submittedPicks = ref<VotePick[]>([]);

const modeMeta = computed(() =>
  eventConfig.value ? VOTING_MODE_META[eventConfig.value.votingMode] : null,
);

function handleDone(picks: VotePick[]) {
  submittedPicks.value = picks;
  step.value = "done";
}

async function loadVoteData(silent = false) {
  try {
    const [vehicleList, session] = await Promise.all([
      fetchVehicles(props.slug),
      fetchVoteSession(props.slug),
    ]);

    vehicles.value = vehicleList;
    deviceToken.value = session.deviceToken;
    eventConfig.value = session.event;

    if (session.hasVoted && session.vote) {
      submittedPicks.value = session.vote.picks;
      step.value = "done";
    } else {
      step.value = "vote";
    }
  } catch (error) {
    if (!silent) {
      toast.error(error instanceof Error ? error.message : "Laden fehlgeschlagen.");
    }
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    fingerprintHash.value = await createDeviceFingerprint();
    await loadVoteData();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Laden fehlgeschlagen.");
  } finally {
    loading.value = false;
  }
});

watch(
  () => props.slug,
  (slug) => {
    setActiveEventSlug(slug);
  },
  { immediate: true },
);

watch(
  () => props.slug,
  async () => {
    loading.value = true;
    submittedPicks.value = [];
    step.value = "vote";
    try {
      await loadVoteData();
    } finally {
      loading.value = false;
    }
  },
);

useLiveRefresh({
  slug: () => props.slug,
  enabled: () => !loading.value,
  onRefresh: () => loadVoteData(true),
});
</script>

<template>
  <div :class="['app-page', step === 'done' && 'app-page-done']">
    <PageHeader
      v-if="step !== 'done'"
      eyebrow="Abstimmung"
      :title="eventConfig?.name ?? modeMeta?.label ?? 'Abstimmung'"
      class="vote-page-header"
    >
      <template v-if="modeMeta" #description>
        <span class="stat-pill">{{ modeMeta.hint }}</span>
      </template>
    </PageHeader>

    <section
      v-if="loading"
      class="content-panel"
    >
      <div class="panel-body flex flex-col gap-3">
        <Skeleton class="h-24 w-full rounded-xl" />
        <Skeleton class="h-16 w-full rounded-xl" />
        <Skeleton class="h-16 w-full rounded-xl" />
      </div>
    </section>

    <section
      v-else-if="step === 'done' && eventConfig"
      class="vote-done-shell content-panel content-panel-glow animate-fade-up"
    >
      <VoteDoneCard :picks="submittedPicks" :voting-mode="eventConfig.votingMode" :config="eventConfig" />
    </section>

    <template v-else-if="eventConfig && deviceToken && fingerprintHash">
      <VotePodiumFlow
        v-if="eventConfig.votingMode === 'PODIUM'"
        :event-slug="slug"
        :vehicles="vehicles"
        :device-token="deviceToken"
        :fingerprint-hash="fingerprintHash"
        @done="handleDone"
      />
      <VoteCoinsFlow
        v-else-if="eventConfig.votingMode === 'COINS'"
        :event-slug="slug"
        :vehicles="vehicles"
        :device-token="deviceToken"
        :fingerprint-hash="fingerprintHash"
        :config="eventConfig"
        @done="handleDone"
      />
      <VoteDuelFlow
        v-else-if="eventConfig.votingMode === 'DUEL'"
        :event-slug="slug"
        :vehicles="vehicles"
        :device-token="deviceToken"
        :fingerprint-hash="fingerprintHash"
        :config="eventConfig"
        @done="handleDone"
      />
      <VoteSwipeFlow
        v-else-if="eventConfig.votingMode === 'SWIPE'"
        :event-slug="slug"
        :vehicles="vehicles"
        :device-token="deviceToken"
        :fingerprint-hash="fingerprintHash"
        :config="eventConfig"
        @done="handleDone"
      />
    </template>
  </div>
</template>
