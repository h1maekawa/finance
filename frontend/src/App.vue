<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layouts/AppHeader.vue'
import { useAuth } from '@/composables/useAuth'
import { useHousehold } from '@/composables/useHousehold'

const { sessionStore, initAuth } = useAuth()
const { fetchHouseholds } = useHousehold()

const loggedIn = computed(() => !!sessionStore.user)

onMounted(async () => {
  await initAuth()
  if (sessionStore.user) {
    await fetchHouseholds()
  }
})

watch(
  () => sessionStore.user?.id,
  async (userId) => {
    if (userId) {
      await fetchHouseholds()
    }
  },
)
</script>

<template>
  <div class="container">
    <AppHeader v-if="loggedIn" />
    <RouterView />
  </div>
</template>
