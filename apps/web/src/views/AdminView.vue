<script setup lang="ts">
import { onMounted, ref } from "vue";
import AdminPanel from "@/components/admin/AdminPanel.vue";
import PageHeader from "@/components/layout/PageHeader.vue";

const panelRef = ref<InstanceType<typeof AdminPanel> | null>(null);

onMounted(() => {
  void panelRef.value?.initialize();
});
</script>

<template>
  <div class="app-page admin-page">
    <PageHeader
      eyebrow="Organisation"
      title="Verwaltung"
      description="Dashboard für Event, Fahrzeuge und Abstimmung"
    />

    <AdminPanel ref="panelRef" layout="page" />
  </div>
</template>
