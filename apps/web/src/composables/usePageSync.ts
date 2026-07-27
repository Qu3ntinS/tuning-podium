import { type Ref } from "vue";
import { useLiveRefresh } from "./useLiveRefresh";
import { usePullToRefresh } from "./usePullToRefresh";

type PageSyncOptions = {
  slug: string | Ref<string> | (() => string);
  enabled?: Ref<boolean> | (() => boolean);
  intervalMs?: number;
  onRefresh: () => void | Promise<void>;
  pullToRefresh?: boolean;
};

/**
 * Live revision polling (auto refresh) + optional pull-to-refresh on mobile.
 */
export function usePageSync({
  slug,
  enabled,
  intervalMs,
  onRefresh,
  pullToRefresh = true,
}: PageSyncOptions) {
  const { forceRefresh } = useLiveRefresh({
    slug,
    enabled,
    intervalMs,
    onRefresh,
  });

  if (pullToRefresh) {
    usePullToRefresh({
      enabled,
      onRefresh: forceRefresh,
    });
  }

  return { forceRefresh };
}
