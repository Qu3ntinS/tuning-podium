<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SunIcon,
  Volume2Icon,
} from "@lucide/vue";
import AdminPanel from "@/components/admin/AdminPanel.vue";
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

const props = defineProps<{
  openAdmin?: boolean;
}>();

const view = ref<"settings" | "admin">("settings");
const panelRef = ref<InstanceType<typeof AdminPanel> | null>(null);

const { preference, setPreference } = useTheme();
const { soundsEnabled, playClick } = useSounds();
const { accessToken } = useAdminAuth();

const isAdminAuthenticated = computed(() => Boolean(accessToken.value));

const sheetTitle = computed(() => {
  if (view.value === "admin") {
    return isAdminAuthenticated.value ? "Verwaltung" : "Organisator-Anmeldung";
  }
  return "Einstellungen";
});

const sheetDescription = computed(() => {
  if (view.value === "admin") {
    return isAdminAuthenticated.value ? "Event und Fahrzeuge" : "Organisator-Anmeldung";
  }
  return "Darstellung und Sound";
});

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

async function refreshAdminPanel() {
  await nextTick();
  await panelRef.value?.initialize();
}

function selectTheme(value: ThemePreference) {
  setPreference(value);
}

function onSoundsToggle(enabled: boolean) {
  soundsEnabled.value = enabled;
  if (enabled) {
    playClick();
  }
}

function openAdminView() {
  view.value = "admin";
  void refreshAdminPanel();
}

function backToSettings() {
  view.value = "settings";
}

watch(
  () => props.openAdmin,
  (shouldOpenAdmin) => {
    if (shouldOpenAdmin) {
      view.value = "admin";
    }
  },
  { immediate: true },
);

watch(open, async (isOpen) => {
  if (isOpen && view.value === "admin") {
    await refreshAdminPanel();
  }
  if (!isOpen) {
    view.value = "settings";
  }
});
</script>

<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <Button
        variant="ghost"
        size="icon-sm"
        :class="
          cn(
            'relative shrink-0 rounded-xl text-muted-foreground hover:bg-foreground/6 hover:text-foreground',
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

    <SheetContent
      side="right"
      :class="
        cn(
          'settings-sheet flex w-full flex-col gap-0 p-0',
          view === 'admin' ? 'sm:max-w-lg lg:max-w-xl' : 'sm:max-w-sm',
        )
      "
    >
      <SheetHeader class="shrink-0 border-b border-border/50 px-4 py-4 pr-12 text-left">
        <div class="flex items-start gap-2">
          <Button
            v-if="view === 'admin'"
            variant="ghost"
            size="icon-sm"
            class="mt-0.5 shrink-0 rounded-lg"
            aria-label="Zurück zu Einstellungen"
            @click="backToSettings"
          >
            <ChevronLeftIcon class="size-4" />
          </Button>
          <div class="min-w-0">
            <SheetTitle class="font-heading text-base">{{ sheetTitle }}</SheetTitle>
            <SheetDescription>{{ sheetDescription }}</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <template v-if="view === 'settings'">
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
            <button type="button" class="settings-theme-option" @click="openAdminView">
              <ShieldCheckIcon class="size-4 shrink-0" />
              <span class="min-w-0 flex-1 text-left">
                <span class="block text-sm font-medium">Verwaltung</span>
              </span>
              <ChevronRightIcon class="size-4 shrink-0 text-muted-foreground" />
            </button>
          </section>
        </template>

        <AdminPanel v-else-if="open" ref="panelRef" @ready="refreshAdminPanel" />
      </div>
    </SheetContent>
  </Sheet>
</template>
