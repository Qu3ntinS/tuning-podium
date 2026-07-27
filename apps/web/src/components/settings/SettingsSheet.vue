<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import {
  ChevronRightIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SunIcon,
  Volume2Icon,
} from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAdminAuth } from "@/composables/useAdminAuth";
import { useSounds } from "@/composables/useSounds";
import { type ThemePreference, useTheme } from "@/composables/useTheme";
import { cn } from "@/lib/utils";

const open = defineModel<boolean>("open", { default: false });

const { preference, setPreference } = useTheme();
const { soundsEnabled, playClick } = useSounds();
const { accessToken } = useAdminAuth();

const isAdminAuthenticated = computed(() => Boolean(accessToken.value));

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof SunIcon;
}> = [
  {
    value: "auto",
    label: "Automatisch",
    icon: MonitorIcon,
  },
  {
    value: "light",
    label: "Hell",
    icon: SunIcon,
  },
  {
    value: "dark",
    label: "Dunkel",
    icon: MoonIcon,
  },
];

function selectTheme(value: ThemePreference) {
  setPreference(value);
}

function onSoundsToggle(enabled: boolean) {
  soundsEnabled.value = enabled;
  if (enabled) {
    playClick();
  }
}

function closeSheet() {
  open.value = false;
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <Button
        variant="ghost"
        size="icon-sm"
        :class="
          cn(
            'relative size-11 shrink-0 rounded-xl text-muted-foreground hover:bg-foreground/6 hover:text-foreground sm:size-8',
          )
        "
        aria-label="Einstellungen öffnen"
      >
        <SettingsIcon class="size-[18px]" />
        <span
          v-if="isAdminAuthenticated"
          class="tab-dot-rose absolute right-1 top-1 size-1.5 rounded-full"
          aria-hidden="true"
        />
      </Button>
    </SheetTrigger>

    <SheetContent side="right" class="settings-sheet flex w-full flex-col gap-0 p-0 sm:max-w-sm">
      <SheetHeader class="shrink-0 border-b border-border/50 px-4 py-4 pr-12 text-left">
        <SheetTitle class="font-heading text-base">Einstellungen</SheetTitle>
        <SheetDescription>Darstellung und Sound</SheetDescription>
      </SheetHeader>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <section class="settings-section">
          <p class="settings-section-title">Darstellung</p>
          <div class="settings-theme-list">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              type="button"
              :class="
                cn(
                  'settings-theme-option',
                  preference === option.value && 'settings-theme-option-active',
                )
              "
              :aria-pressed="preference === option.value"
              @click="selectTheme(option.value)"
            >
              <component :is="option.icon" class="size-4 shrink-0" />
              <span class="min-w-0 text-left">
                <span class="block text-sm font-medium">{{ option.label }}</span>
              </span>
            </button>
          </div>
        </section>

        <Separator class="my-5" />

        <section class="settings-section" data-sound="off">
          <p class="settings-section-title">Sound</p>
          <Field class="settings-sound-field">
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-start gap-3">
                <div class="settings-sound-icon">
                  <Volume2Icon class="size-4" />
                </div>
                <div class="min-w-0">
                  <FieldLabel class="text-sm font-medium">Klicktöne</FieldLabel>
                  <FieldDescription class="mt-1">Bei Tippen auf Buttons.</FieldDescription>
                </div>
              </div>
              <Switch
                :model-value="soundsEnabled"
                aria-label="Klicktöne aktivieren"
                @update:model-value="onSoundsToggle"
              />
            </div>
          </Field>
        </section>

        <Separator class="my-5" />

        <section class="settings-section">
          <p class="settings-section-title">Organisation</p>
          <RouterLink
            to="/admin"
            class="settings-theme-option"
            @click="closeSheet"
          >
            <ShieldCheckIcon class="size-4 shrink-0" />
            <span class="min-w-0 flex-1 text-left">
              <span class="block text-sm font-medium">Verwaltung</span>
            </span>
            <ChevronRightIcon class="size-4 shrink-0 text-muted-foreground" />
          </RouterLink>
        </section>
      </div>
    </SheetContent>
  </Sheet>
</template>
