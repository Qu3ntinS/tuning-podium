export async function createDeviceFingerprint(): Promise<string> {
  const signals = [
    navigator.userAgent,
    navigator.language,
    navigator.languages.join(","),
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(window.devicePixelRatio),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? ""),
    String(navigator.maxTouchPoints ?? 0),
  ].join("|");

  const data = new TextEncoder().encode(signals);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
