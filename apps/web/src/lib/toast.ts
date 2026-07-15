import { markRaw } from "vue";
import { toast as sonnerToast, type ExternalToast } from "vue-sonner";
import ToastCard from "@/components/ui/sonner/ToastCard.vue";

const DEFAULT_DURATION = 4000;

type ToastType = "success" | "error" | "info" | "warning" | "default";

function show(message: string, type: ToastType, options?: ExternalToast) {
  const duration = options?.duration ?? DEFAULT_DURATION;
  const description =
    typeof options?.description === "string" ? options.description : undefined;

  return sonnerToast.custom(markRaw(ToastCard), {
    ...options,
    duration,
    unstyled: true,
    class: "app-toast",
    componentProps: {
      message,
      description,
      type,
      duration,
    },
  });
}

export const toast = {
  success(message: string, options?: ExternalToast) {
    return show(message, "success", options);
  },
  error(message: string, options?: ExternalToast) {
    return show(message, "error", options);
  },
  info(message: string, options?: ExternalToast) {
    return show(message, "info", options);
  },
  warning(message: string, options?: ExternalToast) {
    return show(message, "warning", options);
  },
  message(message: string, options?: ExternalToast) {
    return show(message, "default", options);
  },
  custom: sonnerToast.custom,
  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise,
};
