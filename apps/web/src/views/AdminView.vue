<script setup lang="ts">
import AdminPanel from "@/components/admin/AdminPanel.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
</script>

<template>
  <div class="app-page admin-page">
    <PageHeader
      eyebrow="Organisation"
      title="Verwaltung"
      description="Dashboard für Event, Fahrzeuge und Abstimmung"
    />

    <AdminPanel layout="page" />
  </div>
</template>
