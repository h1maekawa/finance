<script setup lang="ts">
import { computed } from 'vue'
import { sessionStore } from '@/stores/session'
import { useAuth } from '@/composables/useAuth'
import { useHousehold } from '@/composables/useHousehold'
import { useRouter } from 'vue-router'

const { signOut } = useAuth()
const { currentHousehold } = useHousehold()
const router = useRouter()

const accountInitials = computed(() => {
  const name = sessionStore.user?.name || sessionStore.user?.email || 'U'
  return name[0].toUpperCase()
})

async function handleSignOut() {
  await signOut()
  await router.push('/login')
}
</script>

<template>
  <header class="fixed top-0 inset-x-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-outline-variant/10 transition-all duration-500">
    <div class="max-w-[640px] mx-auto px-6 py-4 flex justify-between items-center h-full">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-on-primary">
            <span class="material-symbols-outlined text-[26px]" style="font-variation-settings: 'FILL' 1;">account_balance</span>
        </div>
        <div class="flex flex-col -space-y-1">
          <span class="text-premium-headline text-lg tracking-tight">KAKEIBO</span>
          <span class="text-premium-label !text-[10px] opacity-50">{{ currentHousehold?.name || 'My Household' }}</span>
        </div>
      </div>

      <div class="flex items-center gap-1 bg-surface-container-low/50 p-1.5 rounded-full border border-outline-variant/10">
        <button class="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-all active:scale-90">
          <span class="material-symbols-outlined text-[22px]">notifications</span>
        </button>
        
        <div class="w-px h-6 bg-outline-variant/20 mx-1"></div>

        <button @click="handleSignOut" class="h-10 px-1 flex items-center gap-3 rounded-full hover:bg-red-50 text-red-600 transition-all group overflow-hidden">
          <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface group-hover:scale-110 transition-transform">
             <span class="text-[12px] font-black">{{ accountInitials }}</span>
          </div>
          <span class="material-symbols-outlined text-sm pr-2 group-hover:translate-x-1 transition-transform">logout</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
header {
  height: 72px;
}
</style>
