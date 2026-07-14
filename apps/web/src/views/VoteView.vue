<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import PageHeader from "@/components/layout/PageHeader.vue";
import { Skeleton } from "@/components/ui/skeleton";
import VoteCoinsFlow from "@/components/vote/VoteCoinsFlow.vue";
import VoteDoneCard from "@/components/vote/VoteDoneCard.vue";
import VotePodiumFlow from "@/components/vote/VotePodiumFlow.vue";
import VoteSwipeFlow from "@/components/vote/VoteSwipeFlow.vue";
import { useLiveRefresh } from "@/composables/useLiveRefresh";
import { createDeviceFingerprint } from "@/composables/useDeviceFingerprint";
import {
  fetchVoteSession,
  fetchVehicles,
  type EventConfig,
  type Vehicle,
  type VotePick,
} from "@/lib/api";
import { VOTING_MODE_META } from "@/lib/voting-modes";

const step = ref<"vote" | "done">("vote");
const deviceToken = ref("");
const fingerprintHash = ref("");
const vehicles = ref<Vehicle[]>([]);
const eventConfig = ref<EventConfig | null>(null);
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
    const [vehicleList, session] = await Promise.all([fetchVehicles(), fetchVoteSession()]);

    vehicles.value = vehicleList;
    deviceToken.value = session.deviceToken;
    eventConfig.value = session.config;

    if (session.hasVoted && session.vote) {
      submittedPicks.value = session.vote.picks;
      step.value = "done";
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

useLiveRefresh({
  enabled: () => !loading.value,
  onRefresh: () => loadVoteData(true),
});
</script>

<template>
  <div :class="['app-page', step === 'done' && 'app-page-done']">
    <PageHeader
      v-if="step !== 'done'"
      eyebrow="Abstimmung"
      :title="modeMeta?.label ?? 'Abstimmung'"
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
        :vehicles="vehicles"
        :device-token="deviceToken"
        :fingerprint-hash="fingerprintHash"
        @done="handleDone"
      />
      <VoteCoinsFlow
        v-else-if="eventConfig.votingMode === 'COINS'"
        :vehicles="vehicles"
        :device-token="deviceToken"
        :fingerprint-hash="fingerprintHash"
        :config="eventConfig"
        @done="handleDone"
      />
      <VoteSwipeFlow
        v-else-if="eventConfig.votingMode === 'SWIPE'"
        :vehicles="vehicles"
        :device-token="deviceToken"
        :fingerprint-hash="fingerprintHash"
        :config="eventConfig"
        @done="handleDone"
      />
    </template>
  </div>
</template>
