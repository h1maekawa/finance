<script setup lang="ts">
import { useNotification, type Notification } from '@/composables/useNotification'

const { notifications, removeNotification } = useNotification()

const typeClasses: Record<string, string> = {
  success: 'bg-secondary-container text-on-secondary-container border-secondary/20',
  error: 'bg-error-container text-on-error-container border-error/20',
  info: 'bg-surface-container-highest text-on-surface border-outline-variant/20',
  warning: 'bg-tertiary-container text-on-tertiary-container border-tertiary/20',
}

const typeIcons: Record<string, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
}
</script>

<template>
  <div class="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-[90%] max-w-sm pointer-events-none">
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex flex-col gap-3"
    >
      <div
        v-for="n in notifications"
        :key="n.id"
        :class="['flex items-center gap-3 p-4 rounded-2xl border shadow-lg pointer-events-auto transition-all duration-300 backdrop-blur-md', typeClasses[n.type]]"
      >
        <span class="material-symbols-outlined text-[20px] shrink-0" style="font-variation-settings: 'FILL' 1;">
          {{ typeIcons[n.type] }}
        </span>
        <p class="text-sm font-bold flex-1">{{ n.message }}</p>
        <button
          @click="removeNotification(n.id)"
          class="shrink-0 hover:opacity-60 transition-opacity"
        >
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
