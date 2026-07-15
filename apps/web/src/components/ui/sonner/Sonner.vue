<script lang="ts" setup>
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
    :style="{
      '--width': 'min(22rem, calc(100vw - 2rem))',
    }"
    :toast-options="{
      class: 'app-toast',
      closeButton: false,
      ...props.toastOptions,
    }"
    v-bind="delegatedProps"
  />
</template>
