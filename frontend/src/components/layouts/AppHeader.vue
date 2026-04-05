<script setup lang="ts">
import { computed } from 'vue'
import { sessionStore } from '@/stores/session'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { signOut } = useAuth()
const router = useRouter()

const accountLabel = computed(() =>
  sessionStore.user?.email?.split('@')[0] || sessionStore.user?.id || ''
)

async function handleSignOut() {
  await signOut()
  await router.push('/login')
}
</script>

<template>
  <header class="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm dark:shadow-none flex justify-between items-center px-6 py-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center text-white bg-blue-600">
        <!-- Placeholder for user avatar -->
        <span class="font-bold">{{ accountLabel ? accountLabel[0].toUpperCase() : 'U' }}</span>
      </div>
      <span class="text-xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent font-headline tracking-tight">Mindful Ledger</span>
    </div>
    <div class="flex items-center gap-2">
      <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-300">
        <span class="material-symbols-outlined text-blue-700 dark:text-blue-400">notifications</span>
      </button>
      <button @click="handleSignOut" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-all duration-300">
        <span class="material-symbols-outlined text-red-500">logout</span>
      </button>
    </div>
  </header>
</template>
