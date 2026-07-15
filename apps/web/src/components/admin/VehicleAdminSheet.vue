<script setup lang="ts">
import VehicleProfileAdminFields from "@/components/admin/VehicleProfileAdminFields.vue";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { assetUrl } from "@/lib/api";
import { EMPTY_VEHICLE_PROFILE } from "@/lib/vehicle-profile";

export type VehicleFormState = {
  name: string;
  number: string;
  imageUrl: string;
  description: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
};

const open = defineModel<boolean>("open", { default: false });
const form = defineModel<VehicleFormState>("form", { required: true });

defineProps<{
  mode: "create" | "edit";
  uploading?: boolean;
  saving?: boolean;
}>();

const emit = defineEmits<{
  save: [];
  imageSelect: [event: Event];
}>();

function emptyForm(): VehicleFormState {
  return {
    name: "",
    number: "",
    imageUrl: "",
    ...EMPTY_VEHICLE_PROFILE,
  };
}

defineExpose({ emptyForm });
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent side="right" class="admin-vehicle-sheet flex w-full flex-col gap-0 p-0 sm:max-w-md">
      <SheetHeader class="shrink-0 border-b border-border/50 px-5 py-5 pr-14 text-left">
        <SheetTitle class="font-heading text-base">
          {{ mode === "create" ? "Fahrzeug anlegen" : "Fahrzeug bearbeiten" }}
        </SheetTitle>
        <SheetDescription>Name, Bild und optionales Profil.</SheetDescription>
      </SheetHeader>

      <div class="admin-sheet-body min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <FieldGroup class="gap-5">
          <Field>
            <FieldLabel for="vehicle-sheet-name">Name</FieldLabel>
            <Input id="vehicle-sheet-name" v-model="form.name" placeholder="Fahrzeugname" />
          </Field>
          <Field>
            <FieldLabel for="vehicle-sheet-number">Startnummer (optional)</FieldLabel>
            <Input
              id="vehicle-sheet-number"
              v-model="form.number"
              inputmode="numeric"
              placeholder="12"
            />
          </Field>
          <Field>
            <FieldLabel for="vehicle-sheet-image">Bild hochladen</FieldLabel>
            <Input
              id="vehicle-sheet-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              :disabled="uploading"
              @change="emit('imageSelect', $event)"
            />
          </Field>
          <div v-if="form.imageUrl" class="overflow-hidden rounded-xl">
            <img
              v-if="assetUrl(form.imageUrl)"
              :src="assetUrl(form.imageUrl)!"
              alt="Vorschau"
              class="aspect-video w-full object-cover"
            />
          </div>
          <VehicleProfileAdminFields id-prefix="vehicle-sheet" v-model="form" />
        </FieldGroup>
      </div>

      <div class="admin-sheet-footer shrink-0 border-t border-border/50">
        <Button
          class="w-full min-h-10"
          :disabled="!form.name.trim() || saving"
          @click="emit('save')"
        >
          {{ saving ? "Speichern…" : mode === "create" ? "Anlegen" : "Speichern" }}
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
