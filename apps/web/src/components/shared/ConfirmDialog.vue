<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { confirmState, handleConfirmOpenChange, markConfirmIntent } from "@/lib/confirm";
</script>

<template>
  <AlertDialog :open="confirmState.open" @update:open="handleConfirmOpenChange">
    <AlertDialogContent class="confirm-dialog-content ring-0">
      <AlertDialogHeader class="confirm-dialog-header">
        <AlertDialogTitle class="confirm-dialog-title">
          {{ confirmState.title }}
        </AlertDialogTitle>
        <AlertDialogDescription
          v-if="confirmState.description"
          class="confirm-dialog-description"
        >
          {{ confirmState.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="confirm-dialog-actions">
        <AlertDialogCancel
          variant="ghost"
          class="confirm-dialog-btn confirm-dialog-btn-cancel"
          @pointerdown="markConfirmIntent(false)"
        >
          {{ confirmState.cancelLabel }}
        </AlertDialogCancel>
        <AlertDialogAction
          variant="default"
          :class="[
            'confirm-dialog-btn confirm-dialog-btn-confirm',
            confirmState.destructive && 'confirm-dialog-btn-destructive',
          ]"
          @pointerdown="markConfirmIntent(true)"
        >
          {{ confirmState.confirmLabel }}
        </AlertDialogAction>
      </div>
    </AlertDialogContent>
  </AlertDialog>
</template>
