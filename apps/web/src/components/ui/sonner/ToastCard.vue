<script setup lang="ts">
import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "@lucide/vue";
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    message: string;
    description?: string;
    type?: "success" | "error" | "info" | "warning" | "default";
    duration?: number;
    isPaused?: boolean;
  }>(),
  {
    type: "default",
    duration: 4000,
    isPaused: false,
  },
);

const icon = computed(() => {
  switch (props.type) {
    case "success":
      return CircleCheckIcon;
    case "error":
      return OctagonXIcon;
    case "warning":
      return TriangleAlertIcon;
    case "info":
      return InfoIcon;
    default:
      return InfoIcon;
  }
});

const toneClass = computed(() => {
  switch (props.type) {
    case "success":
      return "toast-card-icon-success";
    case "error":
      return "toast-card-icon-error";
    case "warning":
      return "toast-card-icon-warning";
    case "info":
      return "toast-card-icon-info";
    default:
      return "toast-card-icon-default";
  }
});

const progressClass = computed(() => {
  switch (props.type) {
    case "success":
      return "toast-card-progress-success";
    case "error":
      return "toast-card-progress-error";
    case "warning":
      return "toast-card-progress-warning";
    case "info":
      return "toast-card-progress-info";
    default:
      return "toast-card-progress-default";
  }
});
</script>

<template>
  <div class="toast-card">
    <div :class="cn('toast-card-icon', toneClass)">
      <component :is="icon" class="size-4" />
    </div>

    <div class="toast-card-copy">
      <p class="toast-card-title">{{ message }}</p>
      <p v-if="description" class="toast-card-description">{{ description }}</p>
    </div>

    <div class="toast-card-timer" aria-hidden="true">
      <svg viewBox="0 0 20 20" class="toast-card-timer-svg">
        <circle cx="10" cy="10" r="8" class="toast-card-timer-track" />
        <circle
          cx="10"
          cy="10"
          r="8"
          class="toast-card-timer-progress"
          :style="{
            '--toast-duration': `${duration}ms`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }"
        />
      </svg>
    </div>

    <div
      :class="cn('toast-card-bar', progressClass)"
      :style="{
        '--toast-duration': `${duration}ms`,
        animationPlayState: isPaused ? 'paused' : 'running',
      }"
      aria-hidden="true"
    />
  </div>
</template>
