<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MobileHeader from '@/components/layouts/MobileHeader.vue'

const route = useRoute()

const title = computed(() => {
  if (route.path === '/') return '資金形成ダッシュボード'
  if (route.path === '/accounts') return '口座管理'
  if (route.path === '/investments') return '資産管理'
  if (route.path === '/income') return '収入管理'
  if (route.path === '/expense') return '支出管理'
  if (route.path === '/transactions') return '取引履歴'
  if (route.path === '/assets') return '現預貯金'
  if (route.path === '/settings') return '設定'
  if (route.path === '/categories') return 'カテゴリ管理'
  return '資金形成アプリ'
})
</script>

<template>
  <MobileHeader :title="title" />
</template>
