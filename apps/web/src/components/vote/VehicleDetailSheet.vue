<script setup lang="ts">
import { computed } from "vue";
import { ExternalLinkIcon } from "@lucide/vue";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { assetUrl, type Vehicle } from "@/lib/api";
import {
  hasVehicleProfile,
  vehicleSocialLinks,
} from "@/lib/vehicle-profile";
import {
  vehicleColorClass,
  vehicleDisplayName,
  vehicleShortLabel,
} from "@/lib/vehicle-visual";
import { cn } from "@/lib/utils";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  vehicle: Vehicle | null;
}>();

const imageSrc = computed(() => assetUrl(props.vehicle?.imageUrl));
const colorClass = computed(() =>
  props.vehicle ? vehicleColorClass(props.vehicle.id) : "",
);
const socialLinks = computed(() =>
  props.vehicle ? vehicleSocialLinks(props.vehicle) : [],
);
const showProfile = computed(() => props.vehicle && hasVehicleProfile(props.vehicle));
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent side="bottom" class="vehicle-profile-sheet" :show-close-button="true">
      <template v-if="vehicle && showProfile">
        <div class="vehicle-profile-hero">
          <img
            v-if="imageSrc"
            :src="imageSrc"
            :alt="vehicle.name"
            class="size-full object-cover"
          />
          <div
            v-else
            :class="cn('flex size-full items-center justify-center', colorClass)"
          >
            <span class="font-heading text-5xl font-semibold text-white/95">
              {{ vehicleShortLabel(vehicle) }}
            </span>
          </div>
          <div class="vehicle-profile-hero-scrim" />
          <div class="vehicle-profile-hero-copy">
            <p v-if="vehicle.number" class="vehicle-profile-kicker">#{{ vehicle.number }}</p>
            <SheetHeader class="p-0 text-left">
              <SheetTitle class="vehicle-profile-title">{{ vehicle.name }}</SheetTitle>
              <SheetDescription class="sr-only">
                Profil von {{ vehicleDisplayName(vehicle) }}
              </SheetDescription>
            </SheetHeader>
          </div>
        </div>

        <div class="vehicle-profile-body">
          <p v-if="vehicle.description?.trim()" class="vehicle-profile-description">
            {{ vehicle.description }}
          </p>

          <div v-if="socialLinks.length" class="vehicle-profile-social">
            <p class="vehicle-profile-social-label">Links</p>
            <div class="vehicle-profile-social-grid">
              <a
                v-for="link in socialLinks"
                :key="link.key"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                :class="cn('vehicle-profile-social-link', link.toneClass)"
              >
                <span>{{ link.label }}</span>
                <ExternalLinkIcon class="size-3.5 opacity-80" />
              </a>
            </div>
          </div>
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
