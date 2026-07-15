<script setup lang="ts">
import { StarIcon, Trash2Icon, UploadIcon } from "@lucide/vue";
import { nextTick, useTemplateRef } from "vue";
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
import {
  normalizeVehicleImageDrafts,
  removeVehicleImage,
  setPrimaryVehicleImage,
  type VehicleImageDraft,
} from "@/lib/vehicle-images";
import { cn } from "@/lib/utils";

export type VehicleFormState = {
  name: string;
  number: string;
  images: VehicleImageDraft[];
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
  imagesSelect: [files: File[]];
}>();

const fileInputRef = useTemplateRef<HTMLInputElement>("fileInput");

function emptyForm(): VehicleFormState {
  return {
    name: "",
    number: "",
    images: [],
    ...EMPTY_VEHICLE_PROFILE,
  };
}

function openFilePicker() {
  fileInputRef.value?.click();
}

async function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";

  if (!files.length) return;

  emit("imagesSelect", files);

  await nextTick();
  document.body.style.pointerEvents = "";
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

function setPrimary(url: string) {
  form.value.images = setPrimaryVehicleImage(form.value.images, url);
}

function removeImage(url: string) {
  form.value.images = removeVehicleImage(form.value.images, url);
}

defineExpose({ emptyForm });
</script>

<template>
  <Teleport to="body">
    <input
      ref="fileInput"
      type="file"
      class="sr-only"
      accept="image/jpeg,image/png,image/webp"
      multiple
      tabindex="-1"
      aria-hidden="true"
      @change="handleFileInput"
    />
  </Teleport>

  <Sheet v-model:open="open">
    <SheetContent
      side="right"
      class="admin-vehicle-sheet flex w-full flex-col gap-0 p-0 sm:max-w-md"
      @open-auto-focus.prevent
    >
      <SheetHeader class="shrink-0 border-b border-border/50 px-5 py-5 pr-14 text-left">
        <SheetTitle class="font-heading text-base">
          {{ mode === "create" ? "Fahrzeug anlegen" : "Fahrzeug bearbeiten" }}
        </SheetTitle>
        <SheetDescription>Name, Bilder und optionales Profil.</SheetDescription>
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
            <FieldLabel>Bilder</FieldLabel>
            <Button
              type="button"
              variant="outline"
              class="w-full min-h-10"
              :disabled="uploading"
              @click="openFilePicker"
            >
              <UploadIcon data-icon="inline-start" />
              {{ uploading ? "Hochladen…" : "Bilder hinzufügen" }}
            </Button>
            <p class="mt-2 text-xs text-muted-foreground">
              Mehrere Bilder möglich. Ein Hauptbild für Abstimmung und Rangliste festlegen.
            </p>
          </Field>

          <div v-if="form.images.length" class="admin-vehicle-image-editor">
            <div class="admin-vehicle-image-track">
              <article
                v-for="image in normalizeVehicleImageDrafts(form.images)"
                :key="image.url"
                class="admin-vehicle-image-card"
              >
                <img
                  :src="assetUrl(image.url)!"
                  alt="Fahrzeugbild"
                  class="admin-vehicle-image-preview"
                />
                <div class="admin-vehicle-image-actions">
                  <Button
                    type="button"
                    size="icon-sm"
                    :variant="image.isPrimary ? 'secondary' : 'outline'"
                    :aria-label="image.isPrimary ? 'Hauptbild' : 'Als Hauptbild setzen'"
                    @click="setPrimary(image.url)"
                  >
                    <StarIcon :class="cn(image.isPrimary && 'fill-current')" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    aria-label="Bild entfernen"
                    @click="removeImage(image.url)"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
                <span
                  v-if="image.isPrimary"
                  class="admin-vehicle-image-badge"
                >
                  Hauptbild
                </span>
              </article>
            </div>
          </div>

          <VehicleProfileAdminFields id-prefix="vehicle-sheet" v-model="form" />
        </FieldGroup>
      </div>

      <div class="admin-sheet-footer shrink-0 border-t border-border/50">
        <Button
          class="w-full min-h-10"
          :disabled="!form.name.trim() || saving || uploading"
          @click="emit('save')"
        >
          {{ saving ? "Speichern…" : mode === "create" ? "Anlegen" : "Speichern" }}
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
