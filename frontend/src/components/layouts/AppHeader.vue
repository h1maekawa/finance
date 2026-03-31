<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sessionStore } from '@/stores/session'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { signOut } = useAuth()

const navItems = [
  { path: '/dashboard', label: 'ホーム', icon: '🏠' },
  { path: '/goal', label: '目標', icon: '🎯' },
  { path: '/accounts', label: '口座', icon: '🏦' },
  { path: '/investments', label: '個別株', icon: '📊' },
  { path: '/cashflow', label: '収支', icon: '🧾' },
  { path: '/gmail-import', label: 'Gmail取込', icon: '📧' },
  { path: '/settings', label: '設定', icon: '⚙️' },
]

const title = computed(() => {
  const map: Record<string, string> = {
    '/dashboard': '資金形成ダッシュボード',
    '/goal': '目標',
    '/accounts': '口座管理',
    '/investments': '個別株管理',
    '/cashflow': '収支管理',
    '/setup': '初期設定',
    '/register': '初期設定',
    '/assets': '現預貯金',
    '/settings': '設定',
    '/categories': 'カテゴリ管理',
    '/gmail-import': 'クレジット自動取込',
  }
  return map[route.path] || '家計簿'
})

const accountLabel = computed(() =>
  sessionStore.user?.email?.split('@')[0] || sessionStore.user?.id || ''
)

async function handleSignOut() {
  await signOut()
  await router.push('/login')
}
</script>

<template>
  <!-- デスクトップ: サイドバーナビ -->
  <nav class="sidebar-nav">
    <div class="sidebar-nav__logo">
      <span class="sidebar-nav__logo-icon">💰</span>
      <span class="sidebar-nav__logo-text">家計簿</span>
    </div>

    <button
      v-for="item in navItems"
      :key="item.path"
      :class="['sidebar-nav__item', { active: route.path === item.path }]"
      @click="router.push(item.path)"
    >
      <span class="sidebar-nav__item-icon">{{ item.icon }}</span>
      {{ item.label }}
    </button>

    <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--color-border); margin-top: 2rem;">
      <p style="font-size: 0.78rem; color: var(--color-text-muted); padding: 0 0.75rem 0.5rem;">
        {{ accountLabel }}
      </p>
      <button
        class="sidebar-nav__item"
        style="color: var(--color-danger);"
        @click="handleSignOut"
      >
        <span class="sidebar-nav__item-icon">🚪</span>
        ログアウト
      </button>
    </div>
  </nav>

  <!-- モバイル: トップヘッダー -->
  <header class="mobile-header">
    <span style="width:2.5rem;"></span>
    <h1>{{ title }}</h1>
    <span style="font-size: 0.75rem; color: var(--color-text-secondary); width: 2.5rem; text-align: right;">
      {{ accountLabel }}
    </span>
  </header>
</template>
