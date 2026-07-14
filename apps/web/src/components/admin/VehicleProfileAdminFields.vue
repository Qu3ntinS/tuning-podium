<script setup lang="ts">
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const profile = defineModel<{
  description: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
}>({ required: true });

defineProps<{
  idPrefix: string;
  class?: string;
}>();
</script>

<template>
  <div :class="cn('flex flex-col gap-3', $props.class)">
    <Field>
      <FieldLabel :for="`${idPrefix}-description`">Beschreibung (optional)</FieldLabel>
      <textarea
        :id="`${idPrefix}-description`"
        v-model="profile.description"
        rows="3"
        placeholder="Motor, Umbauten, Besonderheiten …"
        class="dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors focus-visible:ring-3 md:text-sm outline-none placeholder:text-muted-foreground"
      />
      <FieldDescription>In der Abstimmung sichtbar.</FieldDescription>
    </Field>

    <Field>
      <FieldLabel :for="`${idPrefix}-instagram`">Instagram (optional)</FieldLabel>
      <Input
        :id="`${idPrefix}-instagram`"
        v-model="profile.instagramUrl"
        placeholder="@fahrzeug oder https://instagram.com/…"
      />
    </Field>

    <Field>
      <FieldLabel :for="`${idPrefix}-tiktok`">TikTok (optional)</FieldLabel>
      <Input
        :id="`${idPrefix}-tiktok`"
        v-model="profile.tiktokUrl"
        placeholder="@fahrzeug oder https://tiktok.com/…"
      />
    </Field>

    <Field>
      <FieldLabel :for="`${idPrefix}-youtube`">YouTube (optional)</FieldLabel>
      <Input
        :id="`${idPrefix}-youtube`"
        v-model="profile.youtubeUrl"
        placeholder="@kanal oder https://youtube.com/…"
      />
    </Field>

    <Field>
      <FieldLabel :for="`${idPrefix}-website`">Website (optional)</FieldLabel>
      <Input
        :id="`${idPrefix}-website`"
        v-model="profile.websiteUrl"
        placeholder="https://…"
      />
    </Field>
  </div>
</template>
