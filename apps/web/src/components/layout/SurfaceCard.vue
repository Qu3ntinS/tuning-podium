<script setup lang="ts">
import ContentPanel from "@/components/layout/ContentPanel.vue";

defineProps<{
  title?: string;
  description?: string;
  class?: string;
  contentClass?: string;
  glow?: boolean;
}>();
</script>

<template>
  <ContentPanel
    :title="title"
    :description="description"
    :class="class"
    :body-class="contentClass"
    :glow="glow"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
  </ContentPanel>
</template>
