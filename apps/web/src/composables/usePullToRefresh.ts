import { onMounted, onUnmounted, type Ref, unref, watch } from "vue";
import { pullToRefreshState } from "./pull-to-refresh-state";

const THRESHOLD = 72;
const MAX_PULL = 96;

type PullToRefreshOptions = {
  onRefresh: () => void | Promise<void>;
  enabled?: Ref<boolean> | (() => boolean);
};

function isEnabled(enabled?: Ref<boolean> | (() => boolean)) {
  if (enabled === undefined) return true;
  return typeof enabled === "function" ? enabled() : unref(enabled);
}

function canUsePullGesture() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(min-width: 768px)").matches) return false;
  return true;
}

function isScrollAtTop() {
  return window.scrollY <= 2;
}

export function usePullToRefresh({ onRefresh, enabled }: PullToRefreshOptions) {
  let startY = 0;
  let tracking = false;
  let armed = false;

  function resetUi() {
    pullToRefreshState.offset = 0;
    pullToRefreshState.visible = false;
  }

  async function triggerRefresh() {
    if (!isEnabled(enabled) || pullToRefreshState.refreshing) return;

    pullToRefreshState.refreshing = true;
    pullToRefreshState.visible = true;
    pullToRefreshState.offset = THRESHOLD * 0.65;

    try {
      await onRefresh();
    } finally {
      pullToRefreshState.refreshing = false;
      resetUi();
    }
  }

  function onTouchStart(event: TouchEvent) {
    if (!canUsePullGesture() || !isEnabled(enabled) || pullToRefreshState.refreshing) return;
    if (!isScrollAtTop() || event.touches.length !== 1) return;

    startY = event.touches[0]!.clientY;
    tracking = true;
    armed = true;
  }

  function onTouchMove(event: TouchEvent) {
    if (!tracking || !armed || !isEnabled(enabled)) return;

    if (!isScrollAtTop()) {
      tracking = false;
      resetUi();
      return;
    }

    const delta = event.touches[0]!.clientY - startY;
    if (delta <= 0) {
      resetUi();
      return;
    }

    const offset = Math.min(MAX_PULL, delta * 0.45);
    pullToRefreshState.offset = offset;
    pullToRefreshState.visible = offset > 8;

    if (offset > 12) {
      event.preventDefault();
    }
  }

  function onTouchEnd() {
    if (!tracking) return;
    tracking = false;

    if (armed && pullToRefreshState.offset >= THRESHOLD) {
      void triggerRefresh();
      return;
    }

    resetUi();
  }

  function onTouchCancel() {
    tracking = false;
    armed = false;
    if (!pullToRefreshState.refreshing) {
      resetUi();
    }
  }

  function attach() {
    if (!canUsePullGesture()) return;
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });
  }

  function detach() {
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("touchcancel", onTouchCancel);
    if (!pullToRefreshState.refreshing) {
      resetUi();
    }
  }

  onMounted(() => {
    attach();
  });

  onUnmounted(() => {
    detach();
  });

  if (enabled && typeof enabled !== "function") {
    watch(enabled, (active) => {
      if (!active) {
        armed = false;
        tracking = false;
        if (!pullToRefreshState.refreshing) {
          resetUi();
        }
      }
    });
  }

  return {
    triggerRefresh,
  };
}
