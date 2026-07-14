<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import MobileTabBar from "@/components/layout/MobileTabBar.vue";
import SettingsSheet from "@/components/settings/SettingsSheet.vue";
import { Toaster } from "@/components/ui/sonner";
import { useClickSounds } from "@/composables/useSounds";
import { useTheme } from "@/composables/useTheme";
import { cn } from "@/lib/utils";

const route = useRoute();
const router = useRouter();
const { isDark } = useTheme();

useClickSounds();

const toastTheme = computed(() => (isDark.value ? "dark" : "light"));
const settingsOpen = ref(false);
const openAdminInSettings = ref(false);

const navItems = [
  { to: "/vote", label: "Abstimmung" },
  { to: "/leaderboard", label: "Rangliste" },
];

watch(
  () => route.query.admin,
  (value) => {
    if (value) {
      settingsOpen.value = true;
      openAdminInSettings.value = true;
    }
  },
  { immediate: true },
);

watch(settingsOpen, (open) => {
  if (!open) {
    openAdminInSettings.value = false;
    if (route.query.admin) {
      const { admin: _admin, ...rest } = route.query;
      router.replace({ path: route.path, query: rest });
    }
  }
});
</script>

<template>
  <div class="relative min-h-dvh overflow-x-hidden text-foreground">
    <div aria-hidden="true" class="pointer-events-none fixed inset-0 -z-20 bg-background" />

    <div aria-hidden="true" class="mesh-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div class="mesh-orb mesh-orb-a" />
      <div class="mesh-orb mesh-orb-b" />
      <div class="mesh-orb mesh-orb-c" />
      <div class="mesh-grid absolute inset-0" />
    </div>

    <header class="app-header sticky top-0 z-50 bg-background/82 backdrop-blur-xl">
      <div class="header-glow pointer-events-none absolute inset-x-0 bottom-0 h-px" />
      <div class="app-header-inner mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
        <RouterLink to="/vote" class="group flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90 sm:gap-3">
          <div class="logo-mark flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10">
            <span class="font-heading text-sm font-bold tracking-tight text-foreground">TP</span>
          </div>
          <div class="flex min-w-0 flex-col">
            <span class="truncate font-heading text-sm font-semibold tracking-tight sm:text-base">Tuning Podium</span>
            <span class="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:block">
              Event Platform
            </span>
          </div>
        </RouterLink>

        <nav class="nav-shell hidden items-center gap-1 p-1 md:flex">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="
              cn(
                'relative rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-300',
                route.path === item.to
                  ? 'nav-link-active'
                  : 'text-muted-foreground hover:text-foreground',
              )
            "
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="flex shrink-0 items-center">
          <SettingsSheet v-model:open="settingsOpen" :open-admin="openAdminInSettings" />
        </div>
      </div>
    </header>

    <main class="main-shell mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-6">
      <RouterView v-slot="{ Component, route: activeRoute }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="activeRoute.path" />
        </Transition>
      </RouterView>
    </main>

    <MobileTabBar />

    <Toaster
      :theme="toastTheme"
      position="bottom-right"
      :close-button="true"
      :visible-toasts="3"
      :expand="false"
      :gap="8"
      :toast-options="{ duration: 3200 }"
      class="!z-[90]"
    />
  </div>
</template>
