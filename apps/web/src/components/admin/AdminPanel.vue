<script setup lang="ts">
import { computed, ref, watch } from "vue";
import QRCode from "qrcode";
import {
  CarIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PlusIcon,
  QrCodeIcon,
  Settings2Icon,
  Trash2Icon,
  VoteIcon,
} from "@lucide/vue";
import { toast } from "vue-sonner";
import AdminLoginForm from "@/components/admin/AdminLoginForm.vue";
import VehicleAdminSheet, { type VehicleFormState } from "@/components/admin/VehicleAdminSheet.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveRefresh } from "@/composables/useLiveRefresh";
import { useAdminAuth } from "@/composables/useAdminAuth";
import {
  adminLogin,
  assetUrl,
  createVehicle,
  deleteVehicle,
  eventVoteUrl,
  fetchAdminEventConfig,
  fetchAdminMe,
  fetchAdminVehicles,
  fetchAdminVoteStats,
  resetAdminVotes,
  updateAdminEventConfig,
  updateVehicle,
  uploadVehicleImage,
  type EventConfig,
  type Vehicle,
  type VotingMode,
} from "@/lib/api";
import { VOTING_MODE_META } from "@/lib/voting-modes";
import {
  EMPTY_VEHICLE_PROFILE,
  vehicleProfileFromVehicle,
  vehicleProfilePayload,
} from "@/lib/vehicle-profile";
import { cn } from "@/lib/utils";

type AdminSection = "overview" | "event" | "vehicles" | "share";

withDefaults(
  defineProps<{
    layout?: "page" | "embedded";
  }>(),
  {
    layout: "page",
  },
);

const { accessToken, admin, setSession, clearSession } = useAdminAuth();
const authenticated = ref(Boolean(accessToken.value));
const initializing = ref(false);
const loginForm = ref({ email: "", password: "" });
const loading = ref(false);
const vehicles = ref<Vehicle[]>([]);
const eventQrDataUrl = ref("");
const voteUrl = ref(eventVoteUrl());
const uploading = ref(false);
const savingSettings = ref(false);
const resettingVotes = ref(false);
const totalVotes = ref(0);
const eventSettings = ref<EventConfig | null>(null);
const activeSection = ref<AdminSection>("overview");
const vehicleSheetOpen = ref(false);
const vehicleSheetMode = ref<"create" | "edit">("create");
const editingVehicleId = ref<string | null>(null);
const savingVehicle = ref(false);

const settingsForm = ref({
  votingMode: "PODIUM" as VotingMode,
  coinBudget: 10,
  swipeDuels: 12,
});

const vehicleForm = ref<VehicleFormState>({
  name: "",
  number: "",
  imageUrl: "",
  ...EMPTY_VEHICLE_PROFILE,
});

const activeVehicles = computed(() => vehicles.value.filter((v) => v.active).length);
const modeMeta = computed(() => VOTING_MODE_META[settingsForm.value.votingMode]);

const sections: Array<{ id: AdminSection; label: string; icon: typeof LayoutDashboardIcon }> = [
  { id: "overview", label: "Übersicht", icon: LayoutDashboardIcon },
  { id: "event", label: "Abstimmung", icon: VoteIcon },
  { id: "vehicles", label: "Fahrzeuge", icon: CarIcon },
  { id: "share", label: "Teilen", icon: QrCodeIcon },
];

const modeOptions: VotingMode[] = ["PODIUM", "COINS", "SWIPE"];

function resetVehicleForm() {
  vehicleForm.value = {
    name: "",
    number: "",
    imageUrl: "",
    ...EMPTY_VEHICLE_PROFILE,
  };
}

function openCreateVehicle() {
  vehicleSheetMode.value = "create";
  editingVehicleId.value = null;
  resetVehicleForm();
  vehicleSheetOpen.value = true;
  activeSection.value = "vehicles";
}

function openEditVehicle(vehicle: Vehicle) {
  vehicleSheetMode.value = "edit";
  editingVehicleId.value = vehicle.id;
  vehicleForm.value = {
    name: vehicle.name,
    number: vehicle.number?.toString() ?? "",
    imageUrl: vehicle.imageUrl ?? "",
    ...vehicleProfileFromVehicle(vehicle),
  };
  vehicleSheetOpen.value = true;
}

async function uploadImageFile(file: File) {
  if (!accessToken.value) throw new Error("Nicht angemeldet.");
  const result = await uploadVehicleImage(accessToken.value, file);
  return result.asset.url;
}

async function renderEventQr() {
  voteUrl.value = eventVoteUrl();
  eventQrDataUrl.value = await QRCode.toDataURL(voteUrl.value, {
    width: 280,
    margin: 2,
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });
}

async function handleLogin() {
  const email = loginForm.value.email.trim();
  const password = loginForm.value.password;

  if (!email || !password) {
    toast.error("E-Mail und Passwort eingeben.");
    return;
  }
  if (!email.includes("@")) {
    toast.error("Bitte eine gültige E-Mail eingeben.");
    return;
  }
  if (password.length < 8) {
    toast.error("Passwort muss mindestens 8 Zeichen haben.");
    return;
  }

  loading.value = true;
  try {
    const result = await adminLogin(email, password);
    setSession(result.accessToken, result.admin);
    authenticated.value = true;
    loginForm.value.password = "";
    await loadVehicles();
    await loadEventSettings();
    await loadVoteStats();
    await renderEventQr();
    toast.success("Anmeldung erfolgreich.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Login fehlgeschlagen.");
  } finally {
    loading.value = false;
  }
}

function handleLogout() {
  clearSession();
  authenticated.value = false;
  vehicles.value = [];
  activeSection.value = "overview";
}

async function loadVoteStats() {
  if (!accessToken.value) return;
  try {
    const stats = await fetchAdminVoteStats(accessToken.value);
    totalVotes.value = stats.totalVotes;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Stimmenstatistik konnte nicht geladen werden.");
  }
}

async function handleResetVotes() {
  if (!accessToken.value) return;

  const confirmed = confirm(
    `Alle ${totalVotes.value} Stimmen wirklich löschen?\n\nBesucher können danach erneut abstimmen.`,
  );
  if (!confirmed) return;

  resettingVotes.value = true;
  try {
    const result = await resetAdminVotes(accessToken.value);
    totalVotes.value = 0;
    toast.success(`${result.deletedVotes} Stimmen zurückgesetzt.`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Zurücksetzen fehlgeschlagen.");
  } finally {
    resettingVotes.value = false;
  }
}

async function loadEventSettings() {
  if (!accessToken.value) return;
  try {
    const config = await fetchAdminEventConfig(accessToken.value);
    eventSettings.value = config;
    settingsForm.value = {
      votingMode: config.votingMode,
      coinBudget: config.coinBudget,
      swipeDuels: config.swipeDuels,
    };
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Einstellungen konnten nicht geladen werden.");
  }
}

async function handleSaveSettings() {
  if (!accessToken.value) return;
  savingSettings.value = true;
  try {
    const config = await updateAdminEventConfig(accessToken.value, settingsForm.value);
    eventSettings.value = config;
    toast.success("Abstimmung gespeichert.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Speichern fehlgeschlagen.");
  } finally {
    savingSettings.value = false;
  }
}

async function loadVehicles() {
  if (!accessToken.value) return;
  loading.value = true;
  try {
    vehicles.value = await fetchAdminVehicles(accessToken.value);
  } catch (error) {
    clearSession();
    authenticated.value = false;
    toast.error(error instanceof Error ? error.message : "Sitzung abgelaufen.");
  } finally {
    loading.value = false;
  }
}

async function handleVehicleImageSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !accessToken.value) return;

  uploading.value = true;
  try {
    vehicleForm.value.imageUrl = await uploadImageFile(file);
    toast.success("Bild hochgeladen.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
  } finally {
    uploading.value = false;
    input.value = "";
  }
}

async function handleVehicleSave() {
  if (!accessToken.value || !vehicleForm.value.name.trim()) return;

  savingVehicle.value = true;
  try {
    const number = vehicleForm.value.number ? Number(vehicleForm.value.number) : null;
    const payload = {
      name: vehicleForm.value.name.trim(),
      number: Number.isFinite(number) ? number : null,
      imageUrl: vehicleForm.value.imageUrl.trim() || null,
      ...vehicleProfilePayload(vehicleForm.value),
    };

    if (vehicleSheetMode.value === "create") {
      await createVehicle(accessToken.value, payload);
      toast.success("Fahrzeug angelegt.");
    } else if (editingVehicleId.value) {
      await updateVehicle(accessToken.value, editingVehicleId.value, payload);
      toast.success("Fahrzeug gespeichert.");
    }

    vehicleSheetOpen.value = false;
    resetVehicleForm();
    editingVehicleId.value = null;
    await loadVehicles();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Speichern fehlgeschlagen.");
  } finally {
    savingVehicle.value = false;
  }
}

async function toggleActive(vehicle: Vehicle) {
  if (!accessToken.value) return;
  try {
    await updateVehicle(accessToken.value, vehicle.id, { active: !vehicle.active });
    await loadVehicles();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Aktualisieren fehlgeschlagen.");
  }
}

async function handleDelete(vehicle: Vehicle) {
  if (!accessToken.value) return;
  if (!confirm(`„${vehicle.name}" wirklich löschen?`)) return;

  try {
    await deleteVehicle(accessToken.value, vehicle.id);
    if (editingVehicleId.value === vehicle.id) {
      vehicleSheetOpen.value = false;
      editingVehicleId.value = null;
    }
    await loadVehicles();
    toast.success("Fahrzeug gelöscht.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Löschen fehlgeschlagen.");
  }
}

async function downloadEventQr() {
  if (!eventQrDataUrl.value) return;
  const link = document.createElement("a");
  link.href = eventQrDataUrl.value;
  link.download = "tuning-podium-event-qr.png";
  link.click();
}

async function refreshLiveData() {
  if (!accessToken.value || !authenticated.value) return;

  try {
    const [vehicleList, stats, config] = await Promise.all([
      fetchAdminVehicles(accessToken.value),
      fetchAdminVoteStats(accessToken.value),
      fetchAdminEventConfig(accessToken.value),
    ]);

    vehicles.value = vehicleList;
    totalVotes.value = stats.totalVotes;
    eventSettings.value = config;

    if (!savingSettings.value) {
      settingsForm.value = {
        votingMode: config.votingMode,
        coinBudget: config.coinBudget,
        swipeDuels: config.swipeDuels,
      };
    }
  } catch {
    // Background sync stays silent.
  }
}

async function initialize() {
  if (!accessToken.value) {
    authenticated.value = false;
    return;
  }

  initializing.value = true;
  try {
    await fetchAdminMe(accessToken.value);
    authenticated.value = true;
    await Promise.all([loadVehicles(), loadEventSettings(), loadVoteStats(), renderEventQr()]);
  } catch {
    handleLogout();
  } finally {
    initializing.value = false;
  }
}

watch(accessToken, (token) => {
  authenticated.value = Boolean(token);
});

useLiveRefresh({
  enabled: authenticated,
  onRefresh: refreshLiveData,
});

defineExpose({ initialize });
</script>

<template>
  <div :class="cn('admin-panel', layout === 'page' && 'admin-panel-page')">
    <template v-if="initializing">
      <div class="admin-dashboard-skeleton">
        <Skeleton class="h-28 w-full rounded-2xl" />
        <Skeleton class="h-11 w-full rounded-xl" />
        <div class="admin-stat-grid">
          <Skeleton v-for="i in 4" :key="i" class="h-24 rounded-2xl" />
        </div>
      </div>
    </template>

    <template v-else-if="!authenticated">
      <AdminLoginForm
        v-model="loginForm"
        :variant="layout === 'page' ? 'page' : 'sheet'"
        :loading="loading"
        @submit="handleLogin"
      />
    </template>

    <template v-else>
      <header class="admin-topbar content-panel">
        <div class="admin-topbar-main">
          <div class="min-w-0">
            <p class="admin-topbar-eyebrow">Event Dashboard</p>
            <p class="truncate admin-topbar-title">{{ admin?.email }}</p>
          </div>
          <Button variant="outline" class="admin-topbar-btn shrink-0" @click="handleLogout">
            <LogOutIcon />
            Abmelden
          </Button>
        </div>
      </header>

      <div class="admin-nav-scroll">
        <nav class="admin-nav" aria-label="Verwaltungsbereiche">
          <Button
            v-for="section in sections"
            :key="section.id"
            type="button"
            :variant="activeSection === section.id ? 'secondary' : 'outline'"
            class="admin-nav-item"
            @click="activeSection = section.id"
          >
            <component :is="section.icon" />
            <span>{{ section.label }}</span>
          </Button>
        </nav>
      </div>

      <section v-if="activeSection === 'overview'" class="admin-section admin-overview-section content-panel">
        <div class="panel-head">
          <h2 class="panel-title">Übersicht</h2>
          <p class="panel-description">Status und Schnellzugriffe für dein Event.</p>
        </div>
        <div class="panel-body admin-overview-layout">
          <div class="admin-overview-stats">
            <div class="admin-stat-grid">
              <article class="admin-stat-card admin-stat-card-cool">
                <p class="admin-stat-label">Stimmen</p>
                <p class="admin-stat-value">{{ totalVotes }}</p>
              </article>
              <article class="admin-stat-card admin-stat-card-violet">
                <p class="admin-stat-label">Fahrzeuge</p>
                <p class="admin-stat-value">{{ vehicles.length }}</p>
              </article>
              <article class="admin-stat-card admin-stat-card-mint">
                <p class="admin-stat-label">Aktiv</p>
                <p class="admin-stat-value">{{ activeVehicles }}</p>
              </article>
              <article class="admin-stat-card">
                <p class="admin-stat-label">Modus</p>
                <p class="admin-stat-value admin-stat-value-text">{{ modeMeta.label }}</p>
              </article>
            </div>
          </div>

          <div class="admin-overview-actions">
            <p class="admin-overview-actions-label">Schnellzugriff</p>
            <div class="admin-quick-grid">
              <Button
                type="button"
                variant="outline"
                class="admin-choice-card"
                @click="activeSection = 'event'"
              >
                <Settings2Icon />
                <span class="admin-choice-title">Abstimmung</span>
                <span class="admin-choice-meta">{{ modeMeta.label }}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                class="admin-choice-card"
                @click="openCreateVehicle"
              >
                <PlusIcon />
                <span class="admin-choice-title">Fahrzeug</span>
                <span class="admin-choice-meta">Neu anlegen</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                class="admin-choice-card"
                @click="activeSection = 'share'"
              >
                <QrCodeIcon />
                <span class="admin-choice-title">QR-Code</span>
                <span class="admin-choice-meta">Teilen</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="activeSection === 'event'" class="admin-section content-panel">
        <div class="panel-head">
          <h2 class="panel-title">Abstimmungsmodus</h2>
          <p class="panel-description">Wähle, wie Besucher abstimmen.</p>
        </div>
        <div class="panel-body">
          <div class="admin-mode-grid">
            <Button
              v-for="mode in modeOptions"
              :key="mode"
              type="button"
              :variant="settingsForm.votingMode === mode ? 'secondary' : 'outline'"
              class="admin-choice-card admin-choice-card-wide"
              @click="settingsForm.votingMode = mode"
            >
              <span class="admin-choice-title">{{ VOTING_MODE_META[mode].label }}</span>
              <span class="admin-choice-meta">{{ VOTING_MODE_META[mode].hint }}</span>
            </Button>
          </div>

          <FieldGroup class="admin-field-stack">
            <Field v-if="settingsForm.votingMode === 'COINS'">
              <FieldLabel for="coin-budget">Punkte pro Stimme</FieldLabel>
              <Input
                id="coin-budget"
                v-model.number="settingsForm.coinBudget"
                type="number"
                min="3"
                max="100"
              />
            </Field>
            <Field v-if="settingsForm.votingMode === 'SWIPE'">
              <FieldLabel for="swipe-duels">Anzahl Vergleiche</FieldLabel>
              <Input
                id="swipe-duels"
                v-model.number="settingsForm.swipeDuels"
                type="number"
                min="4"
                max="40"
              />
            </Field>
          </FieldGroup>

          <div class="admin-actions admin-actions-fit">
            <Button :disabled="savingSettings" @click="handleSaveSettings">
              {{ savingSettings ? "Speichern…" : "Speichern" }}
            </Button>
          </div>

          <Separator class="admin-section-divider" />

          <div class="admin-danger-zone">
            <div>
              <p class="text-sm font-medium">Abstimmung zurücksetzen</p>
              <p class="mt-1.5 text-sm text-muted-foreground">
                Löscht alle {{ totalVotes }} Stimmen. Besucher können erneut abstimmen.
              </p>
            </div>
            <div class="admin-actions admin-actions-fit">
              <Button
                variant="destructive"
                :disabled="resettingVotes || totalVotes === 0"
                @click="handleResetVotes"
              >
                {{ resettingVotes ? "Zurücksetzen…" : totalVotes === 0 ? "Keine Stimmen" : "Zurücksetzen" }}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="activeSection === 'vehicles'" class="admin-section content-panel">
        <div class="panel-head flex items-start justify-between gap-3">
          <div>
            <h2 class="panel-title">Fahrzeuge</h2>
            <p class="panel-description">{{ vehicles.length }} Einträge · {{ activeVehicles }} aktiv</p>
          </div>
          <Button variant="outline" class="admin-topbar-btn shrink-0" @click="openCreateVehicle">
            <PlusIcon />
            Neu
          </Button>
        </div>

        <div class="panel-body">
          <template v-if="loading">
            <Skeleton v-for="i in 3" :key="i" class="mb-2 h-16 rounded-xl" />
          </template>

          <p v-else-if="vehicles.length === 0" class="text-sm text-muted-foreground">
            Noch keine Fahrzeuge. Lege das erste an.
          </p>

          <div v-else class="admin-vehicle-list">
            <article
              v-for="vehicle in vehicles"
              :key="vehicle.id"
              class="admin-vehicle-row"
            >
              <div class="admin-vehicle-main">
                <div class="admin-vehicle-thumb">
                  <img
                    v-if="assetUrl(vehicle.imageUrl)"
                    :src="assetUrl(vehicle.imageUrl)!"
                    :alt="vehicle.name"
                    class="size-full object-cover"
                  />
                  <span v-else class="text-sm font-semibold text-muted-foreground">
                    {{ vehicle.number ?? "—" }}
                  </span>
                </div>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">
                    {{ vehicle.number ? `#${vehicle.number} · ` : "" }}{{ vehicle.name }}
                  </p>
                  <p class="mt-0.5 text-sm text-muted-foreground">
                    {{ vehicle.active ? "Aktiv" : "Inaktiv" }}
                    <template v-if="vehicle.description?.trim()"> · Profil</template>
                  </p>
                </div>

                <Badge :variant="vehicle.active ? 'default' : 'secondary'" class="shrink-0">
                  {{ vehicle.active ? "Live" : "Aus" }}
                </Badge>
              </div>

              <div class="admin-actions admin-actions-row">
                <Button variant="outline" @click="openEditVehicle(vehicle)">
                  Bearbeiten
                </Button>
                <Button variant="outline" @click="toggleActive(vehicle)">
                  {{ vehicle.active ? "Deaktivieren" : "Aktivieren" }}
                </Button>
                <Button variant="destructive" @click="handleDelete(vehicle)">
                  <Trash2Icon />
                  Löschen
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section v-else-if="activeSection === 'share'" class="admin-section content-panel">
        <div class="panel-head">
          <h2 class="panel-title">Event teilen</h2>
          <p class="panel-description">QR-Code und Link zur Abstimmung.</p>
        </div>
        <div class="panel-body admin-share-body">
          <img
            v-if="eventQrDataUrl"
            :src="eventQrDataUrl"
            alt="Event QR Code"
            class="admin-qr-image"
          />
          <p class="admin-share-url">{{ voteUrl }}</p>
          <div class="admin-actions admin-actions-row">
            <Button variant="outline" @click="renderEventQr">Aktualisieren</Button>
            <Button @click="downloadEventQr">Speichern</Button>
          </div>
        </div>
      </section>

      <VehicleAdminSheet
        v-model:open="vehicleSheetOpen"
        v-model:form="vehicleForm"
        :mode="vehicleSheetMode"
        :uploading="uploading"
        :saving="savingVehicle"
        @save="handleVehicleSave"
        @image-select="handleVehicleImageSelect"
      />
    </template>
  </div>
</template>
