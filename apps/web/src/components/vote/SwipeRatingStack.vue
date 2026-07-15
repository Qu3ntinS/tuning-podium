<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { HeartIcon, InfoIcon, XIcon } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { assetUrl, type Vehicle } from "@/lib/api";
import { hasVehicleProfile } from "@/lib/vehicle-profile";
import { vehicleColorClass, vehicleDisplayName, vehicleShortLabel } from "@/lib/vehicle-visual";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 88;
const EXIT_DISTANCE = 420;

const props = defineProps<{
  current: Vehicle;
  next?: Vehicle | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  rate: [liked: boolean];
  info: [vehicle: Vehicle];
}>();

const offsetX = ref(0);
const offsetY = ref(0);
const dragging = ref(false);
const exiting = ref(false);

let pointerStartX = 0;
let pointerStartY = 0;
let dragOriginX = 0;
let dragOriginY = 0;
let activePointerId: number | null = null;

const cardKey = computed(() => props.current.id);

const frontStyle = computed(() => {
  const rotate = offsetX.value * 0.06;
  const transition = dragging.value || exiting.value ? "none" : "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)";

  return {
    transform: `translate3d(${offsetX.value}px, ${offsetY.value}px, 0) rotate(${rotate}deg)`,
    transition,
  };
});

const likeOpacity = computed(() => Math.min(1, Math.max(0, offsetX.value / 110)));
const nopeOpacity = computed(() => Math.min(1, Math.max(0, -offsetX.value / 110)));

function resetCard() {
  offsetX.value = 0;
  offsetY.value = 0;
  dragging.value = false;
  exiting.value = false;
  activePointerId = null;
}

watch(cardKey, () => {
  resetCard();
});

function onPointerDown(event: PointerEvent) {
  if (props.disabled || exiting.value) return;

  const target = event.currentTarget as HTMLElement;
  dragging.value = true;
  activePointerId = event.pointerId;
  pointerStartX = event.clientX;
  pointerStartY = event.clientY;
  dragOriginX = offsetX.value;
  dragOriginY = offsetY.value;
  target.setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || event.pointerId !== activePointerId) return;

  const deltaX = event.clientX - pointerStartX;
  const deltaY = event.clientY - pointerStartY;
  offsetX.value = dragOriginX + deltaX;
  offsetY.value = dragOriginY + deltaY * 0.18;
}

function commitSwipe(direction: "left" | "right") {
  if (props.disabled || exiting.value) return;

  exiting.value = true;
  offsetX.value = direction === "right" ? EXIT_DISTANCE : -EXIT_DISTANCE;
  offsetY.value = offsetY.value * 0.4;

  window.setTimeout(() => {
    emit("rate", direction === "right");
    resetCard();
  }, 280);
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value || event.pointerId !== activePointerId) return;

  dragging.value = false;
  activePointerId = null;

  if (offsetX.value > SWIPE_THRESHOLD) {
    commitSwipe("right");
    return;
  }

  if (offsetX.value < -SWIPE_THRESHOLD) {
    commitSwipe("left");
    return;
  }

  offsetX.value = 0;
  offsetY.value = 0;
}

function openInfo(vehicle: Vehicle, event: Event) {
  event.stopPropagation();
  event.preventDefault();
  emit("info", vehicle);
}

function onPointerCancel(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return;
  dragging.value = false;
  activePointerId = null;
  offsetX.value = 0;
  offsetY.value = 0;
}
</script>

<template>
  <div class="swipe-duel">
    <div class="swipe-duel-stage">
      <article
        v-if="next"
        class="swipe-duel-card swipe-duel-card-back"
        aria-hidden="true"
      >
        <div class="swipe-duel-media">
          <img
            v-if="assetUrl(next.imageUrl)"
            :src="assetUrl(next.imageUrl)!"
            :alt="next.name"
            class="size-full object-cover"
            draggable="false"
          />
          <div
            v-else
            :class="cn('flex size-full items-center justify-center', vehicleColorClass(next.id))"
          >
            <span class="font-heading text-4xl font-semibold text-white/95">
              {{ vehicleShortLabel(next) }}
            </span>
          </div>
          <div class="swipe-duel-scrim" />
        </div>
        <div class="swipe-duel-meta">
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="swipe-duel-kicker">Als Nächstes</p>
              <p class="truncate text-sm font-medium">{{ vehicleDisplayName(next) }}</p>
            </div>
            <Button
              v-if="hasVehicleProfile(next)"
              type="button"
              variant="secondary"
              size="icon-sm"
              class="shrink-0"
              aria-label="Profil des nächsten Fahrzeugs ansehen"
              @click="openInfo(next, $event)"
              @pointerdown.stop
            >
              <InfoIcon class="size-3.5" />
            </Button>
          </div>
        </div>
      </article>

      <article
        class="swipe-duel-card swipe-duel-card-front"
        :class="dragging && 'swipe-duel-card-dragging'"
        :style="frontStyle"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
      >
        <div
          class="swipe-duel-stamp swipe-duel-stamp-like"
          :style="{ opacity: likeOpacity }"
        >
          LIKE
        </div>
        <div
          class="swipe-duel-stamp swipe-duel-stamp-nope"
          :style="{ opacity: nopeOpacity }"
        >
          NEIN
        </div>

        <div class="swipe-duel-media">
          <img
            v-if="assetUrl(current.imageUrl)"
            :src="assetUrl(current.imageUrl)!"
            :alt="current.name"
            class="size-full object-cover"
            draggable="false"
          />
          <div
            v-else
            :class="cn('flex size-full items-center justify-center', vehicleColorClass(current.id))"
          >
            <span class="font-heading text-4xl font-semibold text-white/95">
              {{ vehicleShortLabel(current) }}
            </span>
          </div>
          <div class="swipe-duel-scrim" />
        </div>
        <div class="swipe-duel-meta">
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="swipe-duel-kicker">Bewerten</p>
              <p class="truncate text-base font-semibold">{{ vehicleDisplayName(current) }}</p>
            </div>
            <Button
              v-if="hasVehicleProfile(current)"
              type="button"
              variant="secondary"
              size="icon-sm"
              class="shrink-0"
              aria-label="Profil ansehen"
              @click="openInfo(current, $event)"
              @pointerdown.stop
            >
              <InfoIcon class="size-3.5" />
            </Button>
          </div>
        </div>
      </article>
    </div>

    <div class="swipe-duel-actions">
      <Button
        type="button"
        variant="outline"
        size="icon"
        class="swipe-duel-action swipe-duel-action-nope"
        :disabled="disabled || exiting"
        aria-label="Dislike"
        @click="commitSwipe('left')"
      >
        <XIcon class="size-5" />
      </Button>
      <Button
        type="button"
        size="icon"
        class="swipe-duel-action swipe-duel-action-like"
        :disabled="disabled || exiting"
        aria-label="Like"
        @click="commitSwipe('right')"
      >
        <HeartIcon class="size-5" />
      </Button>
    </div>
  </div>
</template>
