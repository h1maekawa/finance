<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { sessionStore } from '@/stores/session'
import { useAuth } from '@/composables/useAuth'
import { useHousehold } from '@/composables/useHousehold'

const { signOut } = useAuth()
const { currentHousehold } = useHousehold()
const router = useRouter()
const signingOut = ref(false)

async function handleSignOut() {
  signingOut.value = true
  try {
    await signOut()
    await router.push('/login')
  } finally {
    signingOut.value = false
  }
}

const menuItems = [
  { icon: 'person', label: 'プロフィール設定', to: '/settings' },
  { icon: 'house', label: '家計グループ設定', to: '/settings' },
  { icon: 'category', label: 'カテゴリ管理', to: '/categories' },
  { icon: 'account_balance', label: '口座・カード管理', to: '/accounts' },
  { icon: 'mail', label: 'Gmail取込設定', to: '/gmail-import' },
]
</script>

<template>
  <div class="space-y-6 pb-28">
    <section>
      <p class="font-label text-[11px] text-on-surface-variant font-semibold uppercase tracking-widest">アカウント</p>
      <h1 class="text-3xl font-extrabold tracking-tight text-on-surface font-headline mt-1">設定</h1>
    </section>

    <!-- Profile card -->
    <div class="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm flex items-center gap-4">
      <div class="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary text-2xl font-extrabold">
        {{ (sessionStore.user?.name || sessionStore.user?.email || 'U')[0].toUpperCase() }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-on-surface text-lg truncate">{{ sessionStore.user?.name || 'ユーザー' }}</p>
        <p class="text-sm text-on-surface-variant truncate">{{ sessionStore.user?.email }}</p>
        <p v-if="currentHousehold" class="text-xs text-on-surface-variant mt-1">
          🏠 {{ currentHousehold.name }}
        </p>
      </div>
    </div>

    <!-- Menu list -->
    <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden divide-y divide-outline-variant/10">
      <router-link
        v-for="item in menuItems"
        :key="item.label"
        :to="item.to"
        class="flex items-center gap-4 px-5 py-4 hover:bg-surface-container transition-colors"
      >
        <div class="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center">
          <span class="material-symbols-outlined text-on-primary-fixed-variant text-[20px]" style="font-variation-settings: 'FILL' 1;">{{ item.icon }}</span>
        </div>
        <span class="font-medium text-on-surface flex-1">{{ item.label }}</span>
        <span class="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
      </router-link>
    </div>

    <!-- Logout button -->
    <button
      @click="handleSignOut"
      :disabled="signingOut"
      class="w-full flex items-center justify-center gap-3 py-4 bg-error/10 text-error font-bold rounded-2xl border border-error/20 active:scale-95 transition-transform duration-200 disabled:opacity-50"
    >
      <span class="material-symbols-outlined">logout</span>
      {{ signingOut ? 'ログアウト中...' : 'ログアウト' }}
    </button>

    <p class="text-center text-xs text-on-surface-variant">Finance App v0.1.0</p>
  </div>
</template>
