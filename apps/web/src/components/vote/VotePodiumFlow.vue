<script setup lang="ts">
import { computed, ref } from "vue";
import { toast } from "@/lib/toast";
import SurfaceCard from "@/components/layout/SurfaceCard.vue";
import { Button } from "@/components/ui/button";
import PodiumBar from "@/components/vote/PodiumBar.vue";
import VehiclePickCard from "@/components/vote/VehiclePickCard.vue";
import { submitVote, type Vehicle, type VotePick } from "@/lib/api";
import { RANK_META } from "@/lib/vehicle-visual";

const props = defineProps<{
  eventSlug: string;
  vehicles: Vehicle[];
  deviceToken: string;
  fingerprintHash: string;
}>();

const emit = defineEmits<{
  done: [picks: VotePick[]];
}>();

const submitting = ref(false);
const activeRank = ref<1 | 2 | 3 | null>(1);
const picks = ref<Record<1 | 2 | 3, Vehicle | null>>({ 1: null, 2: null, 3: null });

const vehicleById = computed(() => new Map(props.vehicles.map((v) => [v.id, v])));

const canSubmit = computed(() => picks.value[1] && picks.value[2] && picks.value[3]);

const activeHint = computed(() => {
  if (!activeRank.value) return "Fahrzeug wählen";
  const meta = RANK_META.find((r) => r.rank === activeRank.value);
  return meta ? `${meta.label} · ${meta.points} Pkt` : "";
});

function rankForVehicle(vehicleId: string): number | null {
  for (const meta of RANK_META) {
    const rank = meta.rank as 1 | 2 | 3;
    if (picks.value[rank]?.id === vehicleId) return rank;
  }
  return null;
}

function nextEmptyRank(): 1 | 2 | 3 | null {
  for (const meta of RANK_META) {
    const rank = meta.rank as 1 | 2 | 3;
    if (!picks.value[rank]) return rank;
  }
  return null;
}

function handleSlotClick(rank: 1 | 2 | 3) {
  if (picks.value[rank]) {
    picks.value[rank] = null;
    activeRank.value = rank;
    return;
  }
  activeRank.value = rank;
}

function handleVehicleSelect(vehicleId: string) {
  const existingRank = rankForVehicle(vehicleId);
  if (existingRank) {
    picks.value[existingRank as 1 | 2 | 3] = null;
    activeRank.value = existingRank as 1 | 2 | 3;
    return;
  }

  const targetRank = activeRank.value ?? nextEmptyRank();
  if (!targetRank) {
    toast.info("Podium vollständig. Platz oben auswählen, um zu ersetzen.");
    return;
  }

  const vehicle = vehicleById.value.get(vehicleId);
  if (!vehicle) return;

  picks.value[targetRank] = vehicle;
  activeRank.value = nextEmptyRank();
}

async function handleSubmit() {
  if (!canSubmit.value || submitting.value) return;

  const payload = RANK_META.map((meta) => ({
    vehicleId: picks.value[meta.rank as 1 | 2 | 3]!.id,
    rank: meta.rank,
  }));

  submitting.value = true;
  try {
    const result = await submitVote(props.eventSlug, props.deviceToken, props.fingerprintHash, { picks: payload });
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
  <div class="vote-flow-stack">
    <SurfaceCard class="vote-flow-podium-panel" title="Podium" :description="activeHint">
      <PodiumBar :picks="picks" :active-rank="activeRank" @slot-click="handleSlotClick" />
    </SurfaceCard>

    <SurfaceCard class="vote-flow-vehicles-panel">
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <h2 class="panel-title">Fahrzeuge</h2>
          <span class="stat-pill tabular-nums">{{ vehicles.length }}</span>
        </div>
      </template>

      <div class="vehicle-list-scroll">
        <VehiclePickCard
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
          layout="row"
          :selected-rank="rankForVehicle(vehicle.id)"
          @select="handleVehicleSelect"
        />
      </div>
    </SurfaceCard>

    <div class="vote-cta-spacer vote-flow-cta-spacer" />

    <div class="cta-bar vote-flow-cta">
      <Button
        size="lg"
        class="cta-button"
        :disabled="!canSubmit || submitting"
        @click="handleSubmit"
      >
        {{ submitting ? "Übermitteln…" : "Stimme abgeben" }}
      </Button>
    </div>
  </div>
</template>