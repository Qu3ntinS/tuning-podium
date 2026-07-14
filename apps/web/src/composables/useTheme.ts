import { usePreferredDark, useStorage } from "@vueuse/core";
import { computed, watchEffect } from "vue";

export type ThemePreference = "auto" | "light" | "dark";

const THEME_COLORS = {
  dark: "#070b14",
  light: "#f4f7fb",
} as const;

export function useTheme() {
  const preference = useStorage<ThemePreference>("podium-theme", "auto");
  const systemDark = usePreferredDark();

  const isDark = computed(() => {
    if (preference.value === "auto") return systemDark.value;
    return preference.value === "dark";
  });

  const resolvedMode = computed(() => (isDark.value ? "dark" : "light"));

  watchEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(resolvedMode.value);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", THEME_COLORS[resolvedMode.value]);
    }
  });

  function setPreference(value: ThemePreference) {
    preference.value = value;
  }

  return {
    preference,
    isDark,
    resolvedMode,
    setPreference,
  };
}
