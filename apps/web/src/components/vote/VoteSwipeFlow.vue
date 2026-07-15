<script setup lang="ts">
import { computed, ref } from "vue";
import { toast } from "@/lib/toast";
import SurfaceCard from "@/components/layout/SurfaceCard.vue";
import SwipeRatingStack from "@/components/vote/SwipeRatingStack.vue";
import VehicleDetailSheet from "@/components/vote/VehicleDetailSheet.vue";
import { submitVote, type EventConfig, type Vehicle, type VotePick } from "@/lib/api";

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
const vehicleIndex = ref(0);
const ratings = ref<Array<{ vehicleId: string; points: number }>>([]);
const profileVehicle = ref<Vehicle | null>(null);
const profileOpen = ref(false);

const sortedVehicles = computed(() =>
  [...props.vehicles].sort((a, b) => (a.number ?? 0) - (b.number ?? 0) || a.name.localeCompare(b.name)),
);

const currentVehicle = computed(() => sortedVehicles.value[vehicleIndex.value] ?? null);
const nextVehicle = computed(() => sortedVehicles.value[vehicleIndex.value + 1] ?? null);
const totalVehicles = computed(() => sortedVehicles.value.length);
const progress = computed(() =>
  totalVehicles.value ? Math.round((ratings.value.length / totalVehicles.value) * 100) : 0,
);

function handleVehicleInfo(vehicle: Vehicle) {
  profileVehicle.value = vehicle;
  profileOpen.value = true;
}

function rate(liked: boolean) {
  const vehicle = currentVehicle.value;
  if (!vehicle || submitting.value) return;

  ratings.value.push({ vehicleId: vehicle.id, points: liked ? 1 : 0 });
  if (vehicleIndex.value < sortedVehicles.value.length - 1) {
    vehicleIndex.value += 1;
    return;
  }

  void handleSubmit();
}

async function handleSubmit() {
  if (ratings.value.length !== totalVehicles.value || submitting.value) return;

  submitting.value = true;
  try {
    const result = await submitVote(props.deviceToken, props.fingerprintHash, { picks: ratings.value });
    emit("done", result.vote.picks);
    toast.success("Stimme übermittelt.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Abstimmung fehlgeschlagen.");
    ratings.value = ratings.value.slice(0, -1);
    vehicleIndex.value = Math.max(0, ratings.value.length);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <SurfaceCard
    :title="`Fahrzeug ${ratings.length + 1} / ${totalVehicles}`"
    description="Rechts = Like · Links = Dislike"
    glow
  >
    <div class="flex flex-col gap-4">
      <div class="progress-track">
        <div
          class="progress-fill bar-swipe progress-fill-glow-cool"
          :style="{ width: `${progress}%` }"
        />
      </div>

      <div v-if="totalVehicles < 1" class="vote-empty-state">
        Mindestens ein Fahrzeug erforderlich.
      </div>

      <SwipeRatingStack
        v-else-if="currentVehicle"
        :current="currentVehicle"
        :next="nextVehicle"
        :disabled="submitting"
        @rate="rate"
        @info="handleVehicleInfo"
      />
    </div>

    <VehicleDetailSheet v-model:open="profileOpen" :vehicle="profileVehicle" />
  </SurfaceCard>
</template>
