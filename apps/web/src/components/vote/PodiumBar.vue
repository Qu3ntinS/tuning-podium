<script setup lang="ts">
import { computed } from "vue";
import { assetUrl, type Vehicle } from "@/lib/api";
import { RANK_META, vehicleColorClass, vehicleShortLabel } from "@/lib/vehicle-visual";
import { cn } from "@/lib/utils";

const props = defineProps<{
  picks: Record<1 | 2 | 3, Vehicle | null>;
  activeRank: 1 | 2 | 3 | null;
}>();

const emit = defineEmits<{
  slotClick: [rank: 1 | 2 | 3];
}>();

const slots = computed(() =>
  RANK_META.map((meta) => ({
    ...meta,
    vehicle: props.picks[meta.rank as 1 | 2 | 3],
    isActive: props.activeRank === meta.rank,
    isFilled: Boolean(props.picks[meta.rank as 1 | 2 | 3]),
  })),
);

const slotGlow = (slot: (typeof slots.value)[number]) => {
  if (!slot.isActive) return "";
  return cn("ring-2", slot.ringClass);
};
</script>

<template>
  <div class="flex flex-col gap-2 sm:hidden">
    <button
      v-for="slot in slots"
      :key="`mobile-${slot.rank}`"
      type="button"
      :class="
        cn(
          'soft-row soft-row-interactive w-full gap-3 p-3.5',
          slot.tone,
          slot.isActive && slotGlow(slot),
          slot.isFilled && !slot.isActive && 'opacity-90',
        )
      "
      @click="emit('slotClick', slot.rank as 1 | 2 | 3)"
    >
      <div
        class="flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold"
        :class="slot.isActive ? cn('rounded-full font-heading text-sm font-semibold', slot.badgeClass) : 'bg-foreground/8 text-foreground rounded-full font-heading text-sm font-semibold'"
      >
        {{ slot.rank }}
      </div>

      <div v-if="slot.vehicle" class="size-12 shrink-0 overflow-hidden rounded-lg shadow-md">
        <img
          v-if="assetUrl(slot.vehicle.imageUrl)"
          :src="assetUrl(slot.vehicle.imageUrl)!"
          :alt="slot.vehicle.name"
          class="size-full object-cover"
        />
        <div
          v-else
          :class="
            cn(
              'flex size-full items-center justify-center text-xs font-bold text-white/90',
              vehicleColorClass(slot.vehicle.id),
            )
          "
        >
          {{ vehicleShortLabel(slot.vehicle) }}
        </div>
      </div>
      <div
        v-else
        class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-background/25 text-xs text-muted-foreground"
      >
        {{ slot.isActive ? "+" : "—" }}
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold">{{ slot.label }}</p>
        <p class="truncate text-sm text-muted-foreground">
          <template v-if="slot.vehicle">{{ slot.vehicle.name }}</template>
          <template v-else>{{ slot.isActive ? "Fahrzeug wählen" : "Noch leer" }}</template>
        </p>
      </div>

      <span class="stat-pill shrink-0">{{ slot.points }} Pkt</span>
    </button>
  </div>

  <div class="hidden gap-3 sm:grid sm:grid-cols-3">
    <button
      v-for="slot in slots"
      :key="`desktop-${slot.rank}`"
      type="button"
      :class="
        cn(
          'group flex min-h-[8.5rem] flex-col items-center justify-center gap-2 rounded-xl px-2.5 py-3 transition-all duration-200',
          slot.tone,
          slot.isActive && cn('scale-[1.02]', slotGlow(slot)),
          slot.isFilled && !slot.isActive && 'opacity-90',
        )
      "
      @click="emit('slotClick', slot.rank as 1 | 2 | 3)"
    >
      <div
        class="flex size-7 items-center justify-center rounded-full text-xs font-semibold"
        :class="slot.isActive ? cn('rounded-full font-heading text-sm font-semibold', slot.badgeClass) : 'bg-foreground/8 text-foreground rounded-full font-heading text-sm font-semibold'"
      >
        {{ slot.rank }}
      </div>

      <div class="text-center">
        <p class="text-xs font-semibold">{{ slot.label }}</p>
        <p class="text-[11px] text-muted-foreground">{{ slot.points }} Punkte</p>
      </div>

      <template v-if="slot.vehicle">
        <div class="size-12 overflow-hidden rounded-lg shadow-md transition-transform group-hover:scale-105">
          <img
            v-if="assetUrl(slot.vehicle.imageUrl)"
            :src="assetUrl(slot.vehicle.imageUrl)!"
            :alt="slot.vehicle.name"
            class="size-full object-cover"
          />
          <div
            v-else
            :class="
              cn(
                'flex size-full items-center justify-center text-xs font-bold text-white/90',
                vehicleColorClass(slot.vehicle.id),
              )
            "
          >
            {{ vehicleShortLabel(slot.vehicle) }}
          </div>
        </div>
        <span class="line-clamp-1 w-full text-center text-[11px] font-medium">
          {{ slot.vehicle.name }}
        </span>
      </template>
      <span v-else class="text-[11px] text-muted-foreground">
        {{ slot.isActive ? "Auswählen" : "—" }}
      </span>
    </button>
  </div>
</template>
