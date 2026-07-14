<script setup lang="ts">
import { cn } from "@/lib/utils";

const props = defineProps<{
  title?: string;
  description?: string;
  class?: string;
  bodyClass?: string;
  glow?: boolean;
}>();

const hasHeader = Boolean(props.title || props.description);
</script>

<template>
  <section
    :class="
      cn(
        'content-panel overflow-hidden',
        glow && 'content-panel-glow',
        props.class,
      )
    "
  >
    <header v-if="hasHeader || $slots.header" class="panel-head">
      <slot name="header">
        <h2 v-if="title" class="panel-title">{{ title }}</h2>
        <p v-if="description" class="panel-description">{{ description }}</p>
      </slot>
    </header>
    <div :class="cn(hasHeader || $slots.header ? 'panel-body' : 'panel-body panel-body-flush', bodyClass)">
      <slot />
    </div>
  </section>
</template>
