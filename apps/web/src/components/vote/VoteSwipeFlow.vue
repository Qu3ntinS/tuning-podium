<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import SurfaceCard from "@/components/layout/SurfaceCard.vue";
import SwipeDuelStack from "@/components/vote/SwipeDuelStack.vue";
import VehicleDetailSheet from "@/components/vote/VehicleDetailSheet.vue";
import { submitVote, type DuelInput, type EventConfig, type Vehicle, type VotePick } from "@/lib/api";
import { buildSwipeDuels } from "@/lib/voting-modes";

const props = defineProps<{
  vehicles: Vehicle[];
  deviceToken: string;
  fingerprintHash: string;
  config: EventConfig;
}>();

const emit = defineEmits<{
  done: [picks: VotePick[]];
}>();

const submitting = ref(false);
const duelIndex = ref(0);
const duels = ref<[Vehicle, Vehicle][]>([]);
const results = ref<DuelInput[]>([]);
const profileVehicle = ref<Vehicle | null>(null);
const profileOpen = ref(false);

const currentDuel = computed(() => duels.value[duelIndex.value] ?? null);
const progress = computed(() =>
  duels.value.length ? Math.round((results.value.length / duels.value.length) * 100) : 0,
);
const isComplete = computed(() => results.value.length === duels.value.length && duels.value.length > 0);

onMounted(() => {
  duels.value = buildSwipeDuels(props.vehicles, props.config.swipeDuels);
});

function handleVehicleInfo(vehicle: Vehicle) {
  profileVehicle.value = vehicle;
  profileOpen.value = true;
}

function pickWinner(side: "left" | "right") {
  const duel = currentDuel.value;
  if (!duel || submitting.value) return;

  const [left, right] = duel;
  const winner = side === "left" ? left : right;
  const loser = side === "left" ? right : left;

  results.value.push({ winnerId: winner.id, loserId: loser.id });
  if (duelIndex.value < duels.value.length - 1) {
    duelIndex.value += 1;
    return;
  }

  void handleSubmit();
}

async function handleSubmit() {
  if (!isComplete.value || submitting.value) return;

  submitting.value = true;
  try {
    const result = await submitVote(props.deviceToken, props.fingerprintHash, { duels: results.value });
    emit("done", result.vote.picks);
    toast.success("Stimme übermittelt.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Abstimmung fehlgeschlagen.");
    duelIndex.value = Math.max(0, results.value.length - 1);
    results.value = results.value.slice(0, -1);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <SurfaceCard
    :title="`Duell ${results.length + 1} / ${config.swipeDuels}`"
    description="Rechts wählen · Links überspringen"
    glow
  >
    <div class="flex flex-col gap-4">
      <div class="progress-track">
        <div
          class="progress-fill bar-swipe progress-fill-glow-cool"
          :style="{ width: `${progress}%` }"
        />
      </div>

      <div v-if="vehicles.length < 2" class="vote-empty-state">
        Mindestens zwei Fahrzeuge erforderlich.
      </div>

      <SwipeDuelStack
        v-else-if="currentDuel"
        :left="currentDuel[0]"
        :right="currentDuel[1]"
        :disabled="submitting"
        @pick="pickWinner"
        @info="handleVehicleInfo"
      />
    </div>

    <VehicleDetailSheet v-model:open="profileOpen" :vehicle="profileVehicle" />
  </SurfaceCard>
</template>
