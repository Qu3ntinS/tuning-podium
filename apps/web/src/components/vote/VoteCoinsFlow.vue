<script setup lang="ts">
import { computed, ref } from "vue";
import { toast } from "@/lib/toast";
import { MinusIcon, PlusIcon } from "@lucide/vue";
import SurfaceCard from "@/components/layout/SurfaceCard.vue";
import { Button } from "@/components/ui/button";
import VehiclePickCard from "@/components/vote/VehiclePickCard.vue";
import { submitVote, type EventConfig, type Vehicle, type VotePick } from "@/lib/api";
import { vehicleDisplayName } from "@/lib/vehicle-visual";

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
const allocations = ref<Record<string, number>>({});

const selectedIds = computed(() =>
  Object.entries(allocations.value)
    .filter(([, coins]) => coins > 0)
    .map(([id]) => id),
);

const usedCoins = computed(() =>
  Object.values(allocations.value).reduce((sum, coins) => sum + coins, 0),
);

const remainingCoins = computed(() => props.config.coinBudget - usedCoins.value);

const canSubmit = computed(
  () => remainingCoins.value === 0 && selectedIds.value.length >= 1 && selectedIds.value.length <= 3,
);

function coinsForVehicle(vehicleId: string): number {
  return allocations.value[vehicleId] ?? 0;
}

function setCoins(vehicleId: string, next: number) {
  const maxForVehicle = (allocations.value[vehicleId] ?? 0) + remainingCoins.value;
  const clamped = Math.max(0, Math.min(next, maxForVehicle));
  if (clamped === 0) {
    const { [vehicleId]: _, ...rest } = allocations.value;
    allocations.value = rest;
    return;
  }
  allocations.value = { ...allocations.value, [vehicleId]: clamped };
}

function handleVehicleSelect(vehicleId: string) {
  const current = coinsForVehicle(vehicleId);
  if (current > 0) {
    setCoins(vehicleId, 0);
    return;
  }

  if (selectedIds.value.length >= 3) {
    toast.info("Maximal drei Fahrzeuge.");
    return;
  }
  if (remainingCoins.value < 1) {
    toast.info("Keine Punkte mehr verfügbar.");
    return;
  }

  setCoins(vehicleId, 1);
}

async function handleSubmit() {
  if (!canSubmit.value || submitting.value) return;

  const payload = selectedIds.value.map((vehicleId) => ({
    vehicleId,
    points: allocations.value[vehicleId]!,
  }));

  submitting.value = true;
  try {
    const result = await submitVote(props.deviceToken, props.fingerprintHash, { picks: payload });
    emit("done", result.vote.picks);
    toast.success("Stimme übermittelt.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Abstimmung fehlgeschlagen.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-5">
    <SurfaceCard
      title="Punkteverteilung"
      :description="`${remainingCoins} von ${config.coinBudget} Punkten verfügbar`"
    >
      <div class="flex flex-col gap-2">
        <p v-if="selectedIds.length === 0" class="vote-micro-hint">
          Fahrzeug wählen, Punkte zuweisen.
        </p>

        <div
          v-for="vehicleId in selectedIds"
          :key="vehicleId"
          class="soft-row flex-col gap-2.5 sm:flex-row sm:items-center"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">
              {{ vehicleDisplayName(vehicles.find((v) => v.id === vehicleId)!) }}
            </p>
          </div>
          <div class="flex items-center justify-center gap-2.5">
            <Button
              variant="outline"
              size="icon"
              class="size-8 rounded-full"
              :disabled="coinsForVehicle(vehicleId) <= 1"
              @click="setCoins(vehicleId, coinsForVehicle(vehicleId) - 1)"
            >
              <MinusIcon class="size-4" />
            </Button>
            <span class="min-w-8 text-center font-heading text-lg font-bold tabular-nums text-foreground">
              {{ coinsForVehicle(vehicleId) }}
            </span>
            <Button
              variant="outline"
              size="icon"
              class="size-8 rounded-full"
              :disabled="remainingCoins < 1"
              @click="setCoins(vehicleId, coinsForVehicle(vehicleId) + 1)"
            >
              <PlusIcon class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </SurfaceCard>

    <SurfaceCard title="Fahrzeuge">
      <div class="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <VehiclePickCard
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
          layout="row"
          :selected-rank="coinsForVehicle(vehicle.id) > 0 ? coinsForVehicle(vehicle.id) : null"
          @select="handleVehicleSelect"
        />
      </div>
    </SurfaceCard>

    <div class="vote-cta-spacer" />

    <div class="cta-bar">
      <Button size="lg" class="cta-button" :disabled="!canSubmit || submitting" @click="handleSubmit">
        {{ submitting ? "Übermitteln…" : "Stimme abgeben" }}
      </Button>
    </div>
  </div>
</template>
