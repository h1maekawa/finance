<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/dashboard', label: 'ホーム', icon: 'home' },
  { path: '/entry', label: '入力', icon: 'add_circle' },
  { path: '/reports', label: 'レポート', icon: 'analytics' },
  { path: '/budgets', label: '予算', icon: 'account_balance_wallet' },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pt-3 pb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-t-3xl z-50 shadow-[0_-8px_24px_rgba(25,28,29,0.06)] bg-slate-50/50 dark:bg-slate-800/50">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      :class="[
        'flex flex-col items-center justify-center px-5 py-2 transition-transform duration-200 active:scale-95',
        isActive(item.path)
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100 rounded-2xl scale-105'
          : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-300'
      ]"
    >
      <span class="material-symbols-outlined" :style="isActive(item.path) ? `font-variation-settings: 'FILL' 1;` : ''">
        {{ item.icon }}
      </span>
      <span class="font-label text-[11px] font-semibold uppercase tracking-wider mt-1">{{ item.label }}</span>
    </router-link>
  </nav>
</template>
