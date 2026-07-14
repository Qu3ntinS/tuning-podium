<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const loginForm = defineModel<{ email: string; password: string }>({ required: true });

withDefaults(
  defineProps<{
    loading?: boolean;
    variant?: "page" | "sheet";
  }>(),
  { variant: "page" },
);

const emit = defineEmits<{
  submit: [];
}>();
</script>

<template>
  <div :class="variant === 'sheet' ? 'login-sheet' : 'login-shell'">
    <div v-if="variant === 'page'" class="login-intro">
      <div class="logo-mark login-logo flex size-11 items-center justify-center rounded-2xl">
        <span class="font-heading text-sm font-bold tracking-tight text-foreground">TP</span>
      </div>
      <h1 class="login-title">Anmelden</h1>
      <p class="login-subtitle">Zugang für Organisatoren</p>
    </div>

    <form
      :class="variant === 'sheet' ? 'login-sheet-form' : 'content-panel login-panel'"
      @submit.prevent="emit('submit')"
    >
      <FieldGroup class="gap-4">
        <Field>
          <FieldLabel for="admin-email">E-Mail</FieldLabel>
          <Input
            id="admin-email"
            v-model="loginForm.email"
            type="email"
            autocomplete="username"
            placeholder="name@event.de"
            class="login-input"
          />
        </Field>
        <Field>
          <FieldLabel for="admin-password">Passwort</FieldLabel>
          <Input
            id="admin-password"
            v-model="loginForm.password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="login-input"
          />
        </Field>
      </FieldGroup>

      <Button type="submit" class="login-submit mt-5 w-full" :disabled="loading">
        {{ loading ? "Anmelden…" : "Anmelden" }}
      </Button>
    </form>
  </div>
</template>
