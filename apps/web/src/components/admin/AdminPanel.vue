<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import QRCode from "qrcode";
import { toast } from "vue-sonner";
import SurfaceCard from "@/components/layout/SurfaceCard.vue";
import AdminLoginForm from "@/components/admin/AdminLoginForm.vue";
import VehicleProfileAdminFields from "@/components/admin/VehicleProfileAdminFields.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
const settingsForm = ref({
  votingMode: "PODIUM" as VotingMode,
  coinBudget: 10,
  swipeDuels: 12,
});

const form = ref({
  name: "",
  number: "",
  imageUrl: "",
  imageFile: null as File | null,
  ...EMPTY_VEHICLE_PROFILE,
});

const editingVehicleId = ref<string | null>(null);
const savingVehicleId = ref<string | null>(null);
const editForm = ref({
  name: "",
  number: "",
  imageUrl: "",
  ...EMPTY_VEHICLE_PROFILE,
});

function resetEditForm() {
  editingVehicleId.value = null;
  editForm.value = { name: "", number: "", imageUrl: "", ...EMPTY_VEHICLE_PROFILE };
}

function startEdit(vehicle: Vehicle) {
  editingVehicleId.value = vehicle.id;
  editForm.value = {
    name: vehicle.name,
    number: vehicle.number?.toString() ?? "",
    imageUrl: vehicle.imageUrl ?? "",
    ...vehicleProfileFromVehicle(vehicle),
  };
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
    `Alle ${totalVotes.value} Stimmen wirklich löschen?\n\nBesucher können danach erneut abstimmen. Das Leaderboard startet bei null.`,
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
    toast.success("Abstimmungsmodus gespeichert.");
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

async function handleImageSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !accessToken.value) return;

  uploading.value = true;
  try {
    form.value.imageUrl = await uploadImageFile(file);
    form.value.imageFile = file;
    toast.success("Bild hochgeladen.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
  } finally {
    uploading.value = false;
    input.value = "";
  }
}

async function handleEditImageSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !accessToken.value || !editingVehicleId.value) return;

  uploading.value = true;
  try {
    editForm.value.imageUrl = await uploadImageFile(file);
    toast.success("Bild hochgeladen.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
  } finally {
    uploading.value = false;
    input.value = "";
  }
}

async function handleSaveEdit(vehicle: Vehicle) {
  if (!accessToken.value || !editForm.value.name.trim()) return;

  savingVehicleId.value = vehicle.id;
  try {
    const number = editForm.value.number ? Number(editForm.value.number) : null;
    await updateVehicle(accessToken.value, vehicle.id, {
      name: editForm.value.name.trim(),
      number: Number.isFinite(number) ? number : null,
      imageUrl: editForm.value.imageUrl.trim() || null,
      ...vehicleProfilePayload(editForm.value),
    });
    resetEditForm();
    await loadVehicles();
    toast.success("Fahrzeug gespeichert.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Speichern fehlgeschlagen.");
  } finally {
    savingVehicleId.value = null;
  }
}

async function handleCreate() {
  if (!accessToken.value || !form.value.name.trim()) return;

  try {
    const number = form.value.number ? Number(form.value.number) : null;
    await createVehicle(accessToken.value, {
      name: form.value.name.trim(),
      number: Number.isFinite(number) ? number : null,
      imageUrl: form.value.imageUrl.trim() || null,
      ...vehicleProfilePayload(form.value),
    });
    form.value = { name: "", number: "", imageUrl: "", imageFile: null, ...EMPTY_VEHICLE_PROFILE };
    await loadVehicles();
    toast.success("Fahrzeug angelegt.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Anlegen fehlgeschlagen.");
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
      resetEditForm();
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

const emit = defineEmits<{
  ready: [];
}>();

watch(accessToken, (token) => {
  authenticated.value = Boolean(token);
});

onMounted(() => {
  emit("ready");
});

useLiveRefresh({
  enabled: authenticated,
  onRefresh: refreshLiveData,
});

defineExpose({ initialize });
</script>

<template>
  <div class="admin-panel">
    <template v-if="initializing">
      <div class="flex flex-col gap-3">
        <Skeleton class="h-16 w-full" />
        <Skeleton class="h-40 w-full" />
        <Skeleton class="h-40 w-full" />
      </div>
    </template>

    <template v-else-if="!authenticated">
      <AdminLoginForm v-model="loginForm" variant="sheet" :loading="loading" @submit="handleLogin" />
    </template>

    <template v-else>
      <div class="content-panel p-3.5">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="panel-title">Sitzung aktiv</p>
            <p class="truncate panel-description">{{ admin?.email }}</p>
          </div>
          <Button variant="outline" size="sm" @click="handleLogout">Abmelden</Button>
        </div>
      </div>

      <SurfaceCard title="Abstimmungsmodus">
        <FieldGroup>
          <Field>
            <FieldLabel>Modus</FieldLabel>
            <Select v-model="settingsForm.votingMode">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Modus wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PODIUM">{{ VOTING_MODE_META.PODIUM.label }}</SelectItem>
                <SelectItem value="COINS">{{ VOTING_MODE_META.COINS.label }}</SelectItem>
                <SelectItem value="SWIPE">{{ VOTING_MODE_META.SWIPE.label }}</SelectItem>
              </SelectContent>
            </Select>
            <p class="vote-micro-hint mt-2">
              {{ VOTING_MODE_META[settingsForm.votingMode].description }}
            </p>
          </Field>

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

        <Button class="mt-4" :disabled="savingSettings" @click="handleSaveSettings">
          {{ savingSettings ? "Speichern…" : "Speichern" }}
        </Button>

        <Separator class="my-5" />

        <div class="flex flex-col gap-3 rounded-xl bg-destructive/8 p-3.5">
          <div class="flex flex-col gap-1">
            <p class="text-sm font-medium">Abstimmung zurücksetzen</p>
            <p class="text-xs text-muted-foreground">
              Entfernt alle {{ totalVotes }} Stimmen. Besucher können erneut abstimmen.
            </p>
          </div>
          <Button
            variant="destructive"
            class="w-full"
            :disabled="resettingVotes || totalVotes === 0"
            @click="handleResetVotes"
          >
            {{ resettingVotes ? "Zurücksetzen…" : totalVotes === 0 ? "Keine Stimmen" : "Zurücksetzen" }}
          </Button>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Event-QR-Code">
        <div class="flex flex-col items-center gap-4">
          <img
            v-if="eventQrDataUrl"
            :src="eventQrDataUrl"
            alt="Event QR Code"
            class="size-44 rounded-xl bg-white p-3 shadow-md"
          />
          <p class="break-all text-center font-mono text-xs text-muted-foreground">{{ voteUrl }}</p>
          <div class="flex w-full flex-col gap-2 sm:flex-row">
            <Button variant="outline" class="flex-1" @click="renderEventQr">QR aktualisieren</Button>
            <Button class="flex-1" @click="downloadEventQr">QR speichern</Button>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Neues Fahrzeug">
        <FieldGroup>
          <Field>
            <FieldLabel for="vehicle-name">Name</FieldLabel>
            <Input id="vehicle-name" v-model="form.name" placeholder="Fahrzeugname" />
          </Field>
          <Field>
            <FieldLabel for="vehicle-number">Startnummer (optional)</FieldLabel>
            <Input id="vehicle-number" v-model="form.number" inputmode="numeric" placeholder="12" />
          </Field>
          <Field>
            <FieldLabel for="vehicle-image-file">Bild hochladen</FieldLabel>
            <Input
              id="vehicle-image-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              :disabled="uploading"
              @change="handleImageSelect"
            />
          </Field>
          <div v-if="form.imageUrl" class="overflow-hidden rounded-xl">
            <img
              v-if="assetUrl(form.imageUrl)"
              :src="assetUrl(form.imageUrl)!"
              alt="Vorschau"
              class="aspect-video w-full object-cover"
            />
          </div>
          <VehicleProfileAdminFields id-prefix="vehicle" v-model="form" />
        </FieldGroup>
        <Button class="mt-4 w-full" :disabled="!form.name.trim()" @click="handleCreate">
          Fahrzeug anlegen
        </Button>
      </SurfaceCard>

      <SurfaceCard title="Fahrzeuge" :description="`${vehicles.length} Einträge`">
        <template v-if="loading">
          <Skeleton class="h-14 w-full" />
          <Skeleton class="h-14 w-full" />
        </template>

        <template v-else-if="vehicles.length === 0">
          <p class="text-sm text-muted-foreground">Keine Fahrzeuge vorhanden.</p>
        </template>

        <div v-else class="flex flex-col gap-2">
          <div
            v-for="vehicle in vehicles"
            :key="vehicle.id"
            class="soft-row flex-col gap-3 p-3"
          >
            <template v-if="editingVehicleId === vehicle.id">
              <FieldGroup class="w-full gap-3">
                <Field>
                  <FieldLabel :for="`edit-vehicle-name-${vehicle.id}`">Name</FieldLabel>
                  <Input
                    :id="`edit-vehicle-name-${vehicle.id}`"
                    v-model="editForm.name"
                    placeholder="Fahrzeugname"
                  />
                </Field>
                <Field>
                  <FieldLabel :for="`edit-vehicle-number-${vehicle.id}`">Startnummer (optional)</FieldLabel>
                  <Input
                    :id="`edit-vehicle-number-${vehicle.id}`"
                    v-model="editForm.number"
                    inputmode="numeric"
                    placeholder="12"
                  />
                </Field>
                <Field>
                  <FieldLabel :for="`edit-vehicle-image-${vehicle.id}`">Bild hochladen</FieldLabel>
                  <Input
                    :id="`edit-vehicle-image-${vehicle.id}`"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    :disabled="uploading"
                    @change="handleEditImageSelect"
                  />
                </Field>
                <div v-if="editForm.imageUrl" class="overflow-hidden rounded-xl">
                  <img
                    v-if="assetUrl(editForm.imageUrl)"
                    :src="assetUrl(editForm.imageUrl)!"
                    alt="Vorschau"
                    class="aspect-video w-full object-cover"
                  />
                </div>
                <VehicleProfileAdminFields :id-prefix="`edit-vehicle-${vehicle.id}`" v-model="editForm" />
              </FieldGroup>
              <div class="flex w-full flex-wrap gap-2">
                <Button
                  class="flex-1 sm:flex-none"
                  :disabled="!editForm.name.trim() || savingVehicleId === vehicle.id"
                  @click="handleSaveEdit(vehicle)"
                >
                  {{ savingVehicleId === vehicle.id ? "Speichern…" : "Speichern" }}
                </Button>
                <Button variant="outline" class="flex-1 sm:flex-none" @click="resetEditForm">
                  Abbrechen
                </Button>
              </div>
            </template>

            <template v-else>
              <img
                v-if="assetUrl(vehicle.imageUrl)"
                :src="assetUrl(vehicle.imageUrl)!"
                :alt="vehicle.name"
                class="aspect-video w-full rounded-xl object-cover"
              />
              <div class="flex min-w-0 flex-1 flex-col gap-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate font-medium">
                      {{ vehicle.number ? `#${vehicle.number} · ` : "" }}{{ vehicle.name }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {{ vehicle.active ? "Aktiv" : "Inaktiv" }}
                      <template v-if="vehicle.description?.trim()"> · Profil</template>
                    </p>
                  </div>
                  <Badge :variant="vehicle.active ? 'default' : 'secondary'">
                    {{ vehicle.active ? "Live" : "Aus" }}
                  </Badge>
                </div>
                <Separator />
                <div class="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" @click="startEdit(vehicle)">
                    Bearbeiten
                  </Button>
                  <Button variant="outline" size="sm" @click="toggleActive(vehicle)">
                    {{ vehicle.active ? "Deaktivieren" : "Aktivieren" }}
                  </Button>
                  <Button variant="destructive" size="sm" @click="handleDelete(vehicle)">
                    Löschen
                  </Button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </SurfaceCard>
    </template>
  </div>
</template>
