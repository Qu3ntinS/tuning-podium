const PUBLIC_APP_URL_KEY = "tuning-podium.publicAppUrl";

export const DEFAULT_EVENT_SLUG = "main";

function normalizeBaseUrl(input: string): string {
  return input.trim().replace(/\/$/, "");
}

export function getPublicAppUrlOverride(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PUBLIC_APP_URL_KEY)?.trim() ?? "";
}

export function setPublicAppUrlOverride(url: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeBaseUrl(url);
  if (!normalized) {
    localStorage.removeItem(PUBLIC_APP_URL_KEY);
    return;
  }
  localStorage.setItem(PUBLIC_APP_URL_KEY, normalized);
}

export function getPublicAppBase(): string {
  const override = getPublicAppUrlOverride();
  if (override) return override;

  const configured = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  if (configured) return normalizeBaseUrl(configured);

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export function isUnshareableAppUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return true;
    }
    if (/^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function eventVoteUrl(slug: string = DEFAULT_EVENT_SLUG): string {
  return `${getPublicAppBase()}/vote/${slug}`;
}

export function eventLeaderboardUrl(slug: string = DEFAULT_EVENT_SLUG): string {
  return `${getPublicAppBase()}/leaderboard/${slug}`;
}

export function eventShareText(eventName: string, slug: string): string {
  return `Stimme bei „${eventName}" ab: ${eventVoteUrl(slug)}`;
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!ok) {
    throw new Error("Kopieren nicht unterstützt.");
  }
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function shareEventLinks(eventName: string, slug: string): Promise<"shared" | "unsupported"> {
  if (!canUseNativeShare()) {
    return "unsupported";
  }

  await navigator.share({
    title: `${eventName} · Tuning Podium`,
    text: eventShareText(eventName, slug),
    url: eventVoteUrl(slug),
  });

  return "shared";
}
