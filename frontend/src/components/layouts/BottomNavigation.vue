<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: '/', label: 'ホーム', icon: '🏠' },
  { path: '/goal', label: '目標', icon: '🎯' },
  { path: '/accounts', label: '口座', icon: '🏦' },
  { path: '/investments', label: '個別株', icon: '📊' },
  { path: '/income', label: '収入', icon: '📈' },
  { path: '/expense', label: '支出', icon: '🧾' },
  { path: '/transactions', label: '取引', icon: '💳' },
  { path: '/settings', label: '設定', icon: '⚙️' },
]

const activePath = computed(() => route.path)

function go(path: string) {
  if (route.path === path) return
  void router.push(path)
}
</script>

<template>
  <nav class="bottom-nav">
    <button
      v-for="tab in tabs"
      :key="tab.path"
      :class="['bottom-nav-item', { active: activePath === tab.path }]"
      @click="go(tab.path)"
    >
      <span class="icon">{{ tab.icon }}</span>
      <span class="label">{{ tab.label }}</span>
    </button>
  </nav>
</template>
