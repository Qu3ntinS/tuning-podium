<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { assetUrl } from "@/lib/api";
import { vehicleImages, type VehicleImage } from "@/lib/vehicle-images";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    images?: VehicleImage[];
    imageUrl?: string | null;
    alt: string;
    variant?: "card" | "hero" | "thumb";
    showDots?: boolean;
  }>(),
  {
    variant: "card",
    showDots: true,
  },
);

const trackRef = useTemplateRef<HTMLDivElement>("trackRef");
const activeIndex = ref(0);

const resolvedImages = computed(() =>
  vehicleImages({ imageUrl: props.imageUrl ?? null, images: props.images }),
);

const hasMultiple = computed(() => resolvedImages.value.length > 1);

function syncActiveIndex() {
  const track = trackRef.value;
  if (!track || !hasMultiple.value) return;

  const slideWidth = track.clientWidth;
  if (!slideWidth) return;

  activeIndex.value = Math.min(
    resolvedImages.value.length - 1,
    Math.max(0, Math.round(track.scrollLeft / slideWidth)),
  );
}

function scrollToIndex(index: number) {
  const track = trackRef.value;
  if (!track) return;

  track.scrollTo({
    left: track.clientWidth * index,
    behavior: "smooth",
  });
  activeIndex.value = index;
}

watch(
  resolvedImages,
  (images) => {
    const primaryIndex = images.findIndex((image) => image.isPrimary);
    activeIndex.value = primaryIndex >= 0 ? primaryIndex : 0;

    queueMicrotask(() => {
      const track = trackRef.value;
      if (!track || !hasMultiple.value) return;
      track.scrollLeft = track.clientWidth * activeIndex.value;
    });
  },
  { immediate: true },
);
</script>

<template>
  <div
    :class="
      cn(
        'vehicle-image-gallery',
        variant === 'hero' && 'vehicle-image-gallery-hero',
        variant === 'thumb' && 'vehicle-image-gallery-thumb',
        variant === 'card' && 'vehicle-image-gallery-card',
      )
    "
  >
    <div
      v-if="resolvedImages.length"
      ref="trackRef"
      class="vehicle-image-gallery-track"
      :class="hasMultiple && 'vehicle-image-gallery-track-scroll'"
      @scroll.passive="syncActiveIndex"
    >
      <img
        v-for="image in resolvedImages"
        :key="image.id"
        :src="assetUrl(image.url)!"
        :alt="alt"
        class="vehicle-image-gallery-image"
        draggable="false"
      />
    </div>
    <slot v-else name="fallback" />

    <div
      v-if="showDots && hasMultiple"
      class="vehicle-image-gallery-dots"
      role="tablist"
      :aria-label="`${alt}: Bilder`"
    >
      <button
        v-for="(image, index) in resolvedImages"
        :key="`${image.id}-dot`"
        type="button"
        role="tab"
        :aria-label="`Bild ${index + 1}`"
        :aria-selected="index === activeIndex"
        :aria-current="index === activeIndex ? 'true' : undefined"
        :class="cn('vehicle-image-gallery-dot', index === activeIndex && 'vehicle-image-gallery-dot-active')"
        @click="scrollToIndex(index)"
      >
        <span class="vehicle-image-gallery-dot-core" />
      </button>
    </div>
  </div>
</template>
