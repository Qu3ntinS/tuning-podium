<script setup lang="ts">
import { cn } from "@/lib/utils";

defineProps<{
  title: string;
  description?: string;
  eyebrow?: string;
  class?: string;
}>();
</script>

<template>
  <section :class="cn('page-header animate-fade-up', $props.class)">
    <div class="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div class="flex min-w-0 flex-col gap-2">
        <div class="page-header-titles flex flex-col gap-1.5 sm:gap-2">
          <p v-if="eyebrow" class="page-eyebrow">{{ eyebrow }}</p>
          <h1 class="page-title">{{ title }}</h1>
        </div>
        <div v-if="description && !$slots.description" class="page-description">
          {{ description }}
        </div>
        <div v-else-if="$slots.description" class="page-header-meta">
          <slot name="description" />
        </div>
      </div>
      <div v-if="$slots.aside" class="flex shrink-0 items-center gap-2">
        <slot name="aside" />
      </div>
    </div>
  </section>
</template>
