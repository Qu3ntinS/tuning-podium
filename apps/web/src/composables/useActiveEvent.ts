import { useSessionStorage } from "@vueuse/core";
import { DEFAULT_EVENT_SLUG } from "@/lib/api";

export const ACTIVE_EVENT_SLUG_KEY = "podium-active-event-slug";

function parseStoredSlug(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "string" && parsed.length > 0 ? parsed : null;
  } catch {
    return raw.length > 0 ? raw : null;
  }
}

export function readStoredActiveEventSlug(): string {
  if (typeof window === "undefined") return DEFAULT_EVENT_SLUG;
  return parseStoredSlug(sessionStorage.getItem(ACTIVE_EVENT_SLUG_KEY)) ?? DEFAULT_EVENT_SLUG;
}

export function useActiveEventSlug() {
  const activeEventSlug = useSessionStorage<string>(ACTIVE_EVENT_SLUG_KEY, DEFAULT_EVENT_SLUG);

  function setActiveEventSlug(slug: string) {
    activeEventSlug.value = slug;
  }

  return {
    activeEventSlug,
    setActiveEventSlug,
  };
}
