<script setup lang="ts">
import { computed, ref } from "vue";
import { InfoIcon } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import VehicleDetailSheet from "@/components/vote/VehicleDetailSheet.vue";
import { assetUrl, type Vehicle } from "@/lib/api";
import { primaryVehicleImageUrl } from "@/lib/vehicle-images";
import { hasVehicleProfile } from "@/lib/vehicle-profile";
import { vehicleColorClass, vehicleDisplayName, vehicleShortLabel } from "@/lib/vehicle-visual";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    vehicle: Vehicle;
    selectedRank?: number | null;
    disabled?: boolean;
    layout?: "card" | "row";
  }>(),
  { layout: "card" },
);

const emit = defineEmits<{
  select: [vehicleId: string];
}>();

const detailOpen = ref(false);

const primaryImageSrc = computed(() => assetUrl(primaryVehicleImageUrl(props.vehicle)));
const hasImage = computed(() => Boolean(primaryImageSrc.value));
const colorClass = computed(() => vehicleColorClass(props.vehicle.id));
const showProfile = computed(() => hasVehicleProfile(props.vehicle));

function handleClick() {
  if (props.disabled) return;
  emit("select", props.vehicle.id);
}

function openProfile() {
  detailOpen.value = true;
}
</script>

<template>
  <div
    :class="
      cn(
        'vehicle-pick group relative overflow-hidden rounded-xl text-left transition-all duration-200',
        layout === 'row' ? 'flex w-full items-stretch' : 'flex flex-col',
        selectedRank ? 'vehicle-pick-selected' : '',
        disabled && 'opacity-45',
      )
    "
  >
    <button
      type="button"
      :disabled="disabled"
      :class="
        cn(
          'min-w-0 flex-1 text-left transition-all duration-200',
          layout === 'row' ? 'flex items-stretch' : 'flex flex-col',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )
      "
      @click="handleClick"
    >
      <div
        :class="
          cn(
            'relative shrink-0 overflow-hidden',
            layout === 'row'
              ? 'aspect-square w-[5.5rem] sm:aspect-[4/3] sm:w-full'
              : 'aspect-[4/3] w-full',
          )
        "
      >
        <img
          v-if="hasImage"
          :src="primaryImageSrc!"
          :alt="vehicle.name"
          class="size-full object-cover transition-transform duration-400 group-hover:scale-[1.03]"
        />
        <div
          v-else
          :class="cn('flex size-full items-center justify-center', colorClass)"
        >
          <span
            :class="
              cn(
                'font-heading font-semibold text-white/95',
                layout === 'row' ? 'text-xl sm:text-4xl' : 'text-4xl',
              )
            "
          >
            {{ vehicleShortLabel(vehicle) }}
          </span>
        </div>

        <Badge
          v-if="selectedRank"
          class="absolute top-2 right-2 z-10 border-0 bg-primary text-primary-foreground shadow-md"
        >
          {{ selectedRank }}
        </Badge>
      </div>

      <div
        :class="
          cn(
            'flex min-w-0 flex-1 items-center justify-between gap-2',
            layout === 'row' ? 'px-3.5 py-3' : 'px-3 py-3 sm:px-3.5 sm:py-3.5',
          )
        "
      >
        <span class="truncate text-sm font-medium">{{ vehicleDisplayName(vehicle) }}</span>
        <span
          v-if="selectedRank"
          class="size-1.5 shrink-0 rounded-full bg-primary"
        />
      </div>
    </button>

    <Button
      v-if="showProfile"
      type="button"
      variant="secondary"
      size="icon-sm"
      class="vehicle-pick-info"
      :aria-label="`Profil von ${vehicle.name} ansehen`"
      @click.stop="openProfile"
    >
      <InfoIcon class="size-3.5" />
    </Button>

    <VehicleDetailSheet v-model:open="detailOpen" :vehicle="vehicle" />
  </div>
</template>
