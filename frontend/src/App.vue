<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layouts/AppHeader.vue'
import BottomNavigation from '@/components/layouts/BottomNavigation.vue'
import { useHousehold } from '@/composables/useHousehold'

const { fetchHouseholds } = useHousehold()

onMounted(async () => {
  try {
    await fetchHouseholds()
  } catch (error) {
    console.warn('Failed to fetch households. Set VITE_DEV_HOUSEHOLD_ID for local-only mode.', error)
  }
})
</script>

<template>
  <div class="mobile-shell">
    <AppHeader />
    <main class="mobile-main">
      <RouterView />
    </main>
    <BottomNavigation />
  </div>
</template>
