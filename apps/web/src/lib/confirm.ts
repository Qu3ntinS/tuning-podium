import { reactive } from "vue";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
};

const baseState: ConfirmState = {
  open: false,
  title: "",
  description: undefined,
  confirmLabel: "Bestätigen",
  cancelLabel: "Abbrechen",
  destructive: false,
};

export const confirmState = reactive<ConfirmState>({ ...baseState });

let pending: ((value: boolean) => void) | null = null;
let settled = false;
let confirmIntent: boolean | null = null;

export function settleConfirm(value: boolean) {
  if (settled) return;
  settled = true;
  confirmState.open = false;
  const resolve = pending;
  pending = null;
  confirmIntent = null;
  resolve?.(value);
}

export function markConfirmIntent(value: boolean) {
  confirmIntent = value;
}

export function confirm(options: ConfirmOptions | string): Promise<boolean> {
  if (pending) {
    settleConfirm(false);
  }

  settled = false;
  confirmIntent = null;
  const opts = typeof options === "string" ? { title: options } : options;

  Object.assign(confirmState, baseState, opts, { open: true });

  return new Promise<boolean>((resolve) => {
    pending = resolve;
  });
}

export function handleConfirmOpenChange(open: boolean) {
  if (open) {
    confirmState.open = true;
    return;
  }

  confirmState.open = false;

  if (settled) return;

  settleConfirm(confirmIntent === true);
}
