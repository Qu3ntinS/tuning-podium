<script setup lang="ts">
import { computed } from "vue";
import { Loader2Icon } from "@lucide/vue";
import { pullToRefreshState } from "@/composables/pull-to-refresh-state";

const THRESHOLD = 72;

const progress = computed(() => Math.min(1, pullToRefreshState.offset / THRESHOLD));

const label = computed(() => {
  if (pullToRefreshState.refreshing) return "Aktualisiere…";
  if (progress.value >= 1) return "Loslassen zum Aktualisieren";
  if (pullToRefreshState.visible) return "Ziehen zum Aktualisieren";
  return "";
});
</script>

<template>
  <div
    class="pull-refresh-host pointer-events-none fixed inset-x-0 z-[60] flex justify-center md:hidden"
    :style="{
      top: 'calc(3.25rem + env(safe-area-inset-top, 0px))',
      opacity: pullToRefreshState.visible || pullToRefreshState.refreshing ? 1 : 0,
    }"
    aria-hidden="true"
  >
    <div
      class="pull-refresh-chip"
      :style="{
        transform: `translateY(${pullToRefreshState.refreshing ? 0 : pullToRefreshState.offset * 0.35}px)`,
      }"
    >
      <Loader2Icon
        v-if="pullToRefreshState.refreshing"
        class="size-4 shrink-0 animate-spin text-primary"
      />
      <span
        v-else
        class="pull-refresh-ring"
        :style="{ '--pull-progress': progress }"
      />
      <span class="text-[11px] font-medium text-muted-foreground">{{ label }}</span>
    </div>
  </div>
</template>
