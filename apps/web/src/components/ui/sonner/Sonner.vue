<script lang="ts" setup>
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
  XIcon,
} from "@lucide/vue";
import type { ToasterProps } from "vue-sonner";
import { reactiveOmit } from "@vueuse/core";
import { Toaster as Sonner } from "vue-sonner";
import { cn } from "@/lib/utils";

const props = defineProps<ToasterProps>();
const delegatedProps = reactiveOmit(props, "class", "toastOptions");
</script>

<template>
  <Sonner
    :class="cn('app-toaster group', props.class)"
    :toast-options="{
      class: 'app-toast',
      descriptionClass: 'app-toast-description',
      ...props.toastOptions,
    }"
    v-bind="delegatedProps"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4 text-foreground/70" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4 text-foreground/60" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4 text-destructive" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4 text-destructive" />
    </template>
    <template #loading-icon>
      <Loader2Icon class="size-4 animate-spin text-foreground/60" />
    </template>
    <template #close-icon>
      <XIcon class="size-3.5 text-muted-foreground" />
    </template>
  </Sonner>
</template>
