<script setup lang="ts">
import { ClipboardCheckIcon, TrophyIcon } from "@lucide/vue";
import { RouterLink, useRoute } from "vue-router";
import { cn } from "@/lib/utils";

const route = useRoute();

const tabs = [
  { to: "/vote", label: "Abstimmung", icon: ClipboardCheckIcon, dotClass: "tab-dot-cool" },
  { to: "/leaderboard", label: "Rangliste", icon: TrophyIcon, dotClass: "tab-dot-violet" },
];
</script>

<template>
  <nav
    class="mobile-tab-bar fixed inset-x-0 bottom-0 z-50 md:hidden"
    aria-label="Hauptnavigation"
  >
    <div class="mobile-tab-bar-inner mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        :class="
          cn(
            'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-medium transition-all duration-200',
            route.path === tab.to
              ? 'bg-foreground/6 text-foreground'
              : 'text-muted-foreground active:scale-95',
          )
        "
      >
        <component :is="tab.icon" class="size-5 shrink-0" />
        <span
          v-if="route.path === tab.to"
          :class="cn('absolute top-1.5 size-1 rounded-full', tab.dotClass)"
        />
        <span class="truncate">{{ tab.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
