<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MobileHeader from '@/components/layouts/MobileHeader.vue'
import { sessionStore } from '@/stores/session'

const route = useRoute()

const title = computed(() => {
  if (route.path === '/') return '資金形成ダッシュボード'
  if (route.path === '/goal') return '目標'
  if (route.path === '/accounts') return '口座管理'
  if (route.path === '/investments') return '個別株管理'
  if (route.path === '/cashflow') return '収支管理'
  if (route.path === '/register') return '登録'
  if (route.path === '/assets') return '現預貯金'
  if (route.path === '/settings') return '設定'
  if (route.path === '/categories') return 'カテゴリ管理'
  return '資金形成アプリ'
})

const accountLabel = computed(() =>
  sessionStore.user?.email || sessionStore.user?.id || '',
)
</script>

<template>
  <MobileHeader :title="title" :account-label="accountLabel" />
</template>
