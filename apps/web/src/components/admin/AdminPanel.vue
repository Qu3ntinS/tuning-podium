<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import QRCode from "qrcode";
import {
  CarIcon,
  ChevronRightIcon,
  CopyIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PlusIcon,
  QrCodeIcon,
  Settings2Icon,
  Share2Icon,
  Trash2Icon,
  VoteIcon,
} from "@lucide/vue";
import { toast } from "@/lib/toast";
import { confirm } from "@/lib/confirm";
import AdminLoginForm from "@/components/admin/AdminLoginForm.vue";
import VehicleAdminSheet, { type VehicleFormState } from "@/components/admin/VehicleAdminSheet.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveRefresh } from "@/composables/useLiveRefresh";
import { useActiveEventSlug } from "@/composables/useActiveEvent";
import { useAdminAuth } from "@/composables/useAdminAuth";
import {
  adminLogin,
  assetUrl,
  createAdminEvent,
  createVehicle,
  deleteAdminEvent,
  deleteVehicle,
  copyTextToClipboard,
  canUseNativeShare,
  DEFAULT_EVENT_SLUG,
  eventLeaderboardUrl,
  eventVoteUrl,
  getPublicAppUrlOverride,
  isUnshareableAppUrl,
  setPublicAppUrlOverride,
  shareEventLinks,
  fetchAdminEvents,
  fetchAdminMe,
  fetchAdminVehicles,
  fetchAdminVoteStats,
  normalizeEventSlugInput,
  resetAdminVotes,
  updateAdminEvent,
  updateVehicle,
  uploadVehicleImage,
  type PodiumEvent,
  type Vehicle,
  type VotingMode,
} from "@/lib/api";
import { VOTING_MODE_META } from "@/lib/voting-modes";
import {
  appendVehicleImages,
  normalizeVehicleImageDrafts,
  vehicleImagesFromVehicle,
} from "@/lib/vehicle-images";
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
const { activeEventSlug, setActiveEventSlug } = useActiveEventSlug();
const authenticated = ref(Boolean(accessToken.value));
const initializing = ref(false);
const loginForm = ref({ email: "", password: "" });
const loading = ref(false);
const vehicles = ref<Vehicle[]>([]);
const events = ref<PodiumEvent[]>([]);
const creatingEvent = ref(false);
const showNewEventForm = ref(false);
const newEventForm = ref({ name: "", slug: "" });
const eventQrDataUrl = ref("");
const voteUrl = ref(eventVoteUrl(activeEventSlug.value));
const leaderboardUrl = ref(eventLeaderboardUrl(activeEventSlug.value));
const publicAppUrlInput = ref(getPublicAppUrlOverride());
const shareWarning = computed(() => isUnshareableAppUrl(voteUrl.value));
const nativeShareAvailable = computed(() => canUseNativeShare());
const uploading = ref(false);
const savingSettings = ref(false);
const resettingVotes = ref(false);
const totalVotes = ref(0);
const eventSettings = ref<PodiumEvent | null>(null);
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
  images: [],
  ...EMPTY_VEHICLE_PROFILE,
});

const activeVehicles = computed(() => vehicles.value.filter((v) => v.active).length);
const selectedEvent = computed(
  () => events.value.find((event) => event.slug === activeEventSlug.value) ?? null,
);
const selectedEventId = computed(() => selectedEvent.value?.id ?? null);
const modeMeta = computed(() => VOTING_MODE_META[settingsForm.value.votingMode]);

const sections: Array<{ id: AdminSection; label: string; icon: typeof LayoutDashboardIcon }> = [
  { id: "overview", label: "Übersicht", icon: LayoutDashboardIcon },
  { id: "event", label: "Abstimmung", icon: VoteIcon },
  { id: "vehicles", label: "Fahrzeuge", icon: CarIcon },
  { id: "share", label: "Teilen", icon: QrCodeIcon },
];

const modeOptions: VotingMode[] = ["PODIUM", "COINS", "DUEL", "SWIPE"];

function resetVehicleForm() {
  vehicleForm.value = {
    name: "",
    number: "",
    images: [],
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
    images: vehicleImagesFromVehicle(vehicle),
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
  if (!selectedEvent.value) return;
  voteUrl.value = eventVoteUrl(selectedEvent.value.slug);
  leaderboardUrl.value = eventLeaderboardUrl(selectedEvent.value.slug);
  eventQrDataUrl.value = await QRCode.toDataURL(voteUrl.value, {
    width: 280,
    margin: 2,
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });
}

function applyPublicAppUrl() {
  setPublicAppUrlOverride(publicAppUrlInput.value);
  void renderEventQr();
  toast.success(publicAppUrlInput.value.trim() ? "Öffentliche URL gespeichert." : "URL-Override entfernt.");
}

async function copyLink(url: string, label: string) {
  try {
    await copyTextToClipboard(url);
    toast.success(`${label} kopiert.`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Kopieren fehlgeschlagen.");
  }
}

async function handleNativeShare() {
  if (!selectedEvent.value) return;

  try {
    const result = await shareEventLinks(selectedEvent.value.name, selectedEvent.value.slug);
    if (result === "unsupported") {
      await copyLink(voteUrl.value, "Abstimmungs-Link");
      return;
    }
    toast.success("Teilen-Dialog geöffnet.");
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return;
    toast.error(error instanceof Error ? error.message : "Teilen fehlgeschlagen.");
  }
}

async function loadEvents() {
  if (!accessToken.value) return;
  const list = await fetchAdminEvents(accessToken.value);
  events.value = list;
  if (!list.some((event) => event.slug === activeEventSlug.value)) {
    activeEventSlug.value = list[0]?.slug ?? DEFAULT_EVENT_SLUG;
  }
}

async function selectEvent(eventSlug: string) {
  setActiveEventSlug(eventSlug);
  await Promise.all([loadVehicles(), loadEventSettings(), loadVoteStats(), renderEventQr()]);
}

async function handleCreateEvent() {
  if (!accessToken.value) return;

  const name = newEventForm.value.name.trim();
  const slug = normalizeEventSlugInput(newEventForm.value.slug || name);
  if (!name || !slug) {
    toast.error("Name und Slug sind erforderlich.");
    return;
  }

  creatingEvent.value = true;
  try {
    const event = await createAdminEvent(accessToken.value, { name, slug });
    events.value = [...events.value, event];
    newEventForm.value = { name: "", slug: "" };
    showNewEventForm.value = false;
    await selectEvent(event.slug);
    toast.success(`Event „${event.name}" angelegt.`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Event konnte nicht angelegt werden.");
  } finally {
    creatingEvent.value = false;
  }
}

async function handleDeleteEvent(event: PodiumEvent) {
  if (!accessToken.value || events.value.length <= 1) return;

  const confirmed = await confirm({
    title: `Event „${event.name}" wirklich löschen?`,
    description: "Alle Fahrzeuge und Stimmen dieses Events werden gelöscht.",
    confirmLabel: "Löschen",
    cancelLabel: "Abbrechen",
    destructive: true,
  });
  if (!confirmed) return;

  try {
    await deleteAdminEvent(accessToken.value, event.id);
    events.value = events.value.filter((entry) => entry.id !== event.id);
    if (activeEventSlug.value === event.slug) {
      activeEventSlug.value = events.value[0]?.slug ?? DEFAULT_EVENT_SLUG;
      await Promise.all([loadVehicles(), loadEventSettings(), loadVoteStats(), renderEventQr()]);
    }
    toast.success("Event gelöscht.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Löschen fehlgeschlagen.");
  }
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
    await loadEvents();
    if (selectedEvent.value) {
      await Promise.all([loadVehicles(), loadEventSettings(), loadVoteStats(), renderEventQr()]);
    }
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
  if (!accessToken.value || !selectedEventId.value) return;
  try {
    const stats = await fetchAdminVoteStats(accessToken.value, selectedEventId.value);
    totalVotes.value = stats.totalVotes;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Stimmenstatistik konnte nicht geladen werden.");
  }
}

async function handleResetVotes() {
  if (!accessToken.value || !selectedEventId.value) return;

  const confirmed = await confirm({
    title: `Alle ${totalVotes.value} Stimmen wirklich löschen?`,
    description: "Besucher können danach erneut abstimmen.",
    confirmLabel: "Löschen",
    cancelLabel: "Abbrechen",
    destructive: true,
  });
  if (!confirmed) return;

  resettingVotes.value = true;
  try {
    const result = await resetAdminVotes(accessToken.value, selectedEventId.value);
    totalVotes.value = 0;
    toast.success(`${result.deletedVotes} Stimmen zurückgesetzt.`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Zurücksetzen fehlgeschlagen.");
  } finally {
    resettingVotes.value = false;
  }
}

async function loadEventSettings() {
  if (!accessToken.value || !selectedEvent.value) return;
  try {
    const config = selectedEvent.value;
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
  if (!accessToken.value || !selectedEventId.value) return;
  savingSettings.value = true;
  try {
    const config = await updateAdminEvent(accessToken.value, selectedEventId.value, settingsForm.value);
    eventSettings.value = config;
    events.value = events.value.map((event) => (event.id === config.id ? config : event));
    toast.success("Abstimmung gespeichert.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Speichern fehlgeschlagen.");
  } finally {
    savingSettings.value = false;
  }
}

async function loadVehicles() {
  if (!accessToken.value || !selectedEventId.value) return;
  loading.value = true;
  try {
    vehicles.value = await fetchAdminVehicles(accessToken.value, selectedEventId.value);
  } catch (error) {
    clearSession();
    authenticated.value = false;
    toast.error(error instanceof Error ? error.message : "Sitzung abgelaufen.");
  } finally {
    loading.value = false;
  }
}

async function handleVehicleImagesSelect(files: File[]) {
  if (!accessToken.value || files.length === 0) return;

  uploading.value = true;
  try {
    const uploadedUrls = await Promise.all(files.map((file) => uploadImageFile(file)));
    vehicleForm.value.images = appendVehicleImages(vehicleForm.value.images, uploadedUrls);
    toast.success(uploadedUrls.length === 1 ? "Bild hochgeladen." : `${uploadedUrls.length} Bilder hochgeladen.`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
  } finally {
    uploading.value = false;
  }
}

async function handleVehicleSave() {
  if (!accessToken.value || !selectedEventId.value || !vehicleForm.value.name.trim()) return;

  savingVehicle.value = true;
  try {
    const number = vehicleForm.value.number ? Number(vehicleForm.value.number) : null;
    const images = normalizeVehicleImageDrafts(vehicleForm.value.images);
    const payload = {
      name: vehicleForm.value.name.trim(),
      number: Number.isFinite(number) ? number : null,
      images,
      ...vehicleProfilePayload(vehicleForm.value),
    };

    if (vehicleSheetMode.value === "create") {
      await createVehicle(accessToken.value, selectedEventId.value!, payload);
      toast.success("Fahrzeug angelegt.");
    } else if (editingVehicleId.value) {
      await updateVehicle(accessToken.value, selectedEventId.value!, editingVehicleId.value, payload);
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
  if (!accessToken.value || !selectedEventId.value) return;
  try {
    await updateVehicle(accessToken.value, selectedEventId.value!, vehicle.id, { active: !vehicle.active });
    await loadVehicles();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Aktualisieren fehlgeschlagen.");
  }
}

async function handleDelete(vehicle: Vehicle) {
  if (!accessToken.value || !selectedEventId.value) return;

  const confirmed = await confirm({
    title: `„${vehicle.name}" wirklich löschen?`,
    confirmLabel: "Löschen",
    cancelLabel: "Abbrechen",
    destructive: true,
  });
  if (!confirmed) return;

  try {
    await deleteVehicle(accessToken.value, selectedEventId.value!, vehicle.id);
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
  link.download = `${selectedEvent.value?.slug ?? "event"}-qr.png`;
  link.click();
}

async function refreshLiveData() {
  if (!accessToken.value || !authenticated.value || !selectedEventId.value) return;

  try {
    const [vehicleList, stats, eventList] = await Promise.all([
      fetchAdminVehicles(accessToken.value, selectedEventId.value),
      fetchAdminVoteStats(accessToken.value, selectedEventId.value),
      fetchAdminEvents(accessToken.value),
    ]);

    vehicles.value = vehicleList;
    totalVotes.value = stats.totalVotes;
    events.value = eventList;

    const config = eventList.find((event) => event.id === selectedEventId.value);
    if (config) {
      eventSettings.value = config;
      if (!savingSettings.value) {
        settingsForm.value = {
          votingMode: config.votingMode,
          coinBudget: config.coinBudget,
          swipeDuels: config.swipeDuels,
        };
      }
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
    await loadEvents();
    if (selectedEvent.value) {
      await Promise.all([loadVehicles(), loadEventSettings(), loadVoteStats(), renderEventQr()]);
    }
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
  slug: () => activeEventSlug.value,
  enabled: authenticated,
  onRefresh: refreshLiveData,
});

watch(activeSection, (section) => {
  if (section === "share") {
    void renderEventQr();
  }
});

onMounted(() => {
  void initialize();
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

        <div v-if="events.length" class="admin-topbar-event">
          <div class="admin-topbar-event-head">
            <div class="min-w-0">
              <p class="admin-topbar-eyebrow">Aktives Event</p>
              <p v-if="selectedEvent" class="admin-topbar-event-slug">/{{ selectedEvent.slug }}</p>
            </div>
            <div class="admin-topbar-event-actions">
              <Button variant="outline" size="sm" @click="showNewEventForm = !showNewEventForm">
                <PlusIcon />
                Neues Event
              </Button>
              <Button
                v-if="selectedEvent && events.length > 1"
                variant="outline"
                size="sm"
                @click="handleDeleteEvent(selectedEvent)"
              >
                <Trash2Icon />
                Löschen
              </Button>
            </div>
          </div>

          <div class="admin-event-pills" role="tablist" aria-label="Event auswählen">
            <Button
              v-for="event in events"
              :key="event.id"
              type="button"
              size="sm"
              role="tab"
              :aria-selected="event.slug === activeEventSlug"
              :variant="event.slug === activeEventSlug ? 'secondary' : 'outline'"
              @click="selectEvent(event.slug)"
            >
              {{ event.name }}
            </Button>
          </div>
        </div>
      </header>

      <section
        v-if="showNewEventForm"
        class="content-panel admin-event-create"
      >
        <div class="panel-body admin-settings-stack">
          <div>
            <h2 class="panel-title">Neues Event anlegen</h2>
            <p class="panel-description">Eigenes Event mit eigener URL, Fahrzeugen und Abstimmung.</p>
          </div>

          <FieldGroup class="admin-field-stack">
            <Field>
              <FieldLabel for="new-event-name">Name</FieldLabel>
              <Input
                id="new-event-name"
                v-model="newEventForm.name"
                placeholder="Sommerfest 2026"
              />
            </Field>
            <Field>
              <FieldLabel for="new-event-slug">Slug (URL)</FieldLabel>
              <Input
                id="new-event-slug"
                v-model="newEventForm.slug"
                placeholder="sommerfest"
              />
            </Field>
          </FieldGroup>

          <div class="admin-actions admin-actions-fit">
            <Button variant="outline" @click="showNewEventForm = false">Abbrechen</Button>
            <Button :disabled="creatingEvent" @click="handleCreateEvent">
              {{ creatingEvent ? "Anlegen…" : "Event anlegen" }}
            </Button>
          </div>
        </div>
      </section>

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
        <div class="panel-head admin-overview-head">
          <div>
            <h2 class="panel-title">Übersicht</h2>
            <p class="panel-description">{{ activeVehicles }} von {{ vehicles.length }} Fahrzeugen aktiv</p>
          </div>
          <Badge variant="secondary" class="admin-overview-mode-badge shrink-0">
            {{ modeMeta.label }}
          </Badge>
        </div>

        <div class="panel-body admin-overview-layout">
          <div class="admin-overview-kpis">
            <article class="admin-stat-card admin-stat-featured admin-stat-card-cool">
              <p class="admin-stat-label">Stimmen gesamt</p>
              <p class="admin-stat-value admin-stat-value-featured">{{ totalVotes }}</p>
              <p class="admin-stat-hint">Alle eingegangenen Abstimmungen</p>
            </article>

            <article class="admin-stat-card admin-stat-vehicles admin-stat-card-violet">
              <p class="admin-stat-label">Fahrzeuge</p>
              <p class="admin-stat-value">{{ vehicles.length }}</p>
            </article>

            <article class="admin-stat-card admin-stat-active admin-stat-card-mint">
              <p class="admin-stat-label">Aktiv</p>
              <p class="admin-stat-value">{{ activeVehicles }}</p>
            </article>

            <article class="admin-stat-card admin-stat-mode">
              <p class="admin-stat-label">Abstimmungsmodus</p>
              <p class="admin-stat-value admin-stat-value-text">{{ modeMeta.label }}</p>
              <p class="admin-stat-hint">{{ modeMeta.hint }}</p>
            </article>
          </div>

          <div class="admin-overview-actions">
            <p class="admin-overview-actions-label">Schnellzugriff</p>
            <div class="admin-overview-link-list">
              <Button
                type="button"
                variant="outline"
                class="admin-overview-link"
                @click="activeSection = 'event'"
              >
                <span class="admin-overview-link-icon admin-overview-link-icon-cool">
                  <Settings2Icon />
                </span>
                <span class="admin-overview-link-copy">
                  <span class="admin-overview-link-title">Abstimmung</span>
                  <span class="admin-overview-link-meta">{{ modeMeta.label }}</span>
                </span>
                <ChevronRightIcon class="admin-overview-link-chevron" />
              </Button>

              <Button
                type="button"
                variant="outline"
                class="admin-overview-link"
                @click="openCreateVehicle"
              >
                <span class="admin-overview-link-icon admin-overview-link-icon-violet">
                  <PlusIcon />
                </span>
                <span class="admin-overview-link-copy">
                  <span class="admin-overview-link-title">Fahrzeug anlegen</span>
                  <span class="admin-overview-link-meta">Neues Teilnehmerfahrzeug</span>
                </span>
                <ChevronRightIcon class="admin-overview-link-chevron" />
              </Button>

              <Button
                type="button"
                variant="outline"
                class="admin-overview-link"
                @click="activeSection = 'share'"
              >
                <span class="admin-overview-link-icon admin-overview-link-icon-mint">
                  <QrCodeIcon />
                </span>
                <span class="admin-overview-link-copy">
                  <span class="admin-overview-link-title">Event teilen</span>
                  <span class="admin-overview-link-meta">QR-Code & Link</span>
                </span>
                <ChevronRightIcon class="admin-overview-link-chevron" />
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
        <div class="panel-body admin-settings-stack">
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
            <Field v-if="settingsForm.votingMode === 'DUEL'">
              <FieldLabel for="swipe-duels">Anzahl Duelle</FieldLabel>
              <Input
                id="swipe-duels"
                v-model.number="settingsForm.swipeDuels"
                type="number"
                min="4"
                max="40"
              />
            </Field>
            <Field v-if="settingsForm.votingMode === 'SWIPE'">
              <p class="text-sm text-muted-foreground">
                Jedes aktive Fahrzeug wird einmal angezeigt. Like = 1 Punkt, Dislike = 0 Punkte.
                Die Rangliste sortiert nach Gesamt-Likes.
              </p>
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

              <div class="admin-vehicle-actions">
                <Button variant="outline" size="sm" @click="openEditVehicle(vehicle)">
                  Bearbeiten
                </Button>
                <Button variant="outline" size="sm" @click="toggleActive(vehicle)">
                  {{ vehicle.active ? "Aus" : "An" }}
                </Button>
                <Button variant="destructive" size="sm" @click="handleDelete(vehicle)">
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
          <p class="panel-description">
            Links und QR für {{ selectedEvent?.name ?? "dieses Event" }}.
          </p>
        </div>
        <div class="panel-body admin-share-body admin-settings-stack">
          <div v-if="shareWarning" class="admin-share-warning">
            <p class="admin-share-warning-title">Nicht öffentlich erreichbar</p>
            <p class="admin-share-warning-copy">
              Der Link zeigt auf localhost oder ein privates Netzwerk. Gäste können ihn nicht öffnen.
              Trage unten deine echte Domain ein (z. B. https://vote.dein-event.de).
            </p>
          </div>

          <FieldGroup class="admin-field-stack admin-share-url-field">
            <Field>
              <FieldLabel for="public-app-url">Öffentliche App-URL</FieldLabel>
              <Input
                id="public-app-url"
                v-model="publicAppUrlInput"
                placeholder="https://vote.dein-event.de"
              />
            </Field>
            <div class="admin-actions admin-actions-fit">
              <Button variant="outline" @click="applyPublicAppUrl">URL übernehmen</Button>
            </div>
          </FieldGroup>

          <img
            v-if="eventQrDataUrl"
            :src="eventQrDataUrl"
            alt="Event QR Code"
            class="admin-qr-image"
          />

          <div class="admin-share-links">
            <article class="admin-share-link-row">
              <div class="min-w-0">
                <p class="admin-share-link-label">Abstimmung</p>
                <p class="admin-share-url">{{ voteUrl }}</p>
              </div>
              <Button variant="outline" size="icon" aria-label="Abstimmungs-Link kopieren" @click="copyLink(voteUrl, 'Abstimmungs-Link')">
                <CopyIcon class="size-4" />
              </Button>
            </article>

            <article class="admin-share-link-row">
              <div class="min-w-0">
                <p class="admin-share-link-label">Rangliste</p>
                <p class="admin-share-url">{{ leaderboardUrl }}</p>
              </div>
              <Button variant="outline" size="icon" aria-label="Ranglisten-Link kopieren" @click="copyLink(leaderboardUrl, 'Ranglisten-Link')">
                <CopyIcon class="size-4" />
              </Button>
            </article>
          </div>

          <div class="admin-actions admin-actions-row admin-share-actions">
            <Button v-if="nativeShareAvailable" variant="outline" @click="handleNativeShare">
              <Share2Icon class="size-4" />
              Teilen
            </Button>
            <Button variant="outline" @click="copyLink(voteUrl, 'Abstimmungs-Link')">
              <CopyIcon class="size-4" />
              Link kopieren
            </Button>
            <Button @click="downloadEventQr">QR speichern</Button>
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
        @images-select="handleVehicleImagesSelect"
      />
    </template>
  </div>
</template>
