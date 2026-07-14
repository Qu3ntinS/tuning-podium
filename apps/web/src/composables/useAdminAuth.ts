import { useSessionStorage } from "@vueuse/core";
import type { AdminUser } from "@/lib/api";

const TOKEN_KEY = "podium-admin-token";
const ADMIN_KEY = "podium-admin-user";

export function useAdminAuth() {
  const accessToken = useSessionStorage<string | null>(TOKEN_KEY, null);
  const admin = useSessionStorage<AdminUser | null>(ADMIN_KEY, null);

  function setSession(token: string, user: AdminUser) {
    accessToken.value = token;
    admin.value = user;
  }

  function clearSession() {
    accessToken.value = null;
    admin.value = null;
  }

  return {
    accessToken,
    admin,
    isAuthenticated: () => Boolean(accessToken.value),
    setSession,
    clearSession,
  };
}
