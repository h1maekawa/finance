<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: '/', label: 'ホーム', icon: '🏠' },
  { path: '/income', label: '収入', icon: '📈' },
  { path: '/expense', label: '支出', icon: '🧾' },
  { path: '/transactions', label: '取引', icon: '💳' },
  { path: '/assets', label: '現預貯金', icon: '🏦' },
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
