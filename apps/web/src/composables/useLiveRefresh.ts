import { onMounted, onUnmounted, type Ref, unref, watch } from "vue";
import { fetchLiveRevision } from "@/lib/api";

type LiveRefreshOptions = {
  slug: string | Ref<string> | (() => string);
  enabled?: Ref<boolean> | (() => boolean);
  intervalMs?: number;
  onRefresh: () => void | Promise<void>;
};

function isEnabled(enabled?: Ref<boolean> | (() => boolean)) {
  if (enabled === undefined) return true;
  return typeof enabled === "function" ? enabled() : unref(enabled);
}

function resolveSlug(slug: string | Ref<string> | (() => string)) {
  return typeof slug === "function" ? slug() : unref(slug);
}

export function useLiveRefresh({ slug, enabled, intervalMs = 5_000, onRefresh }: LiveRefreshOptions) {
  let revision: string | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let checking = false;

  async function checkRevision() {
    if (!isEnabled(enabled) || checking || document.visibilityState === "hidden") return;

    checking = true;
    try {
      const live = await fetchLiveRevision(resolveSlug(slug));
      if (revision === null) {
        revision = live.revision;
        return;
      }

      if (live.revision !== revision) {
        revision = live.revision;
        await onRefresh();
      }
    } catch {
      // Background sync should stay silent.
    } finally {
      checking = false;
    }
  }

  function start() {
    stop();
    if (!isEnabled(enabled)) return;
    void checkRevision();
    timer = setInterval(() => {
      void checkRevision();
    }, intervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function handleVisibility() {
    if (document.visibilityState === "visible") {
      void checkRevision();
    }
  }

  onMounted(() => {
    start();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
  });

  onUnmounted(() => {
    stop();
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("focus", handleVisibility);
  });

  if (enabled && typeof enabled !== "function") {
    watch(enabled, (active) => {
      if (active) {
        revision = null;
        start();
      } else {
        stop();
      }
    });
  }

  return {
    refreshNow: checkRevision,
  };
}
