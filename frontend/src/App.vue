<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layouts/AppHeader.vue'
import BottomNavigation from '@/components/layouts/BottomNavigation.vue'
import { useHousehold } from '@/composables/useHousehold'
import { useAuth } from '@/composables/useAuth'
import { supabase } from '@/lib/supabase'

const { sessionStore, initAuth } = useAuth()
const { fetchHouseholds, households } = useHousehold()

const loggedIn = computed(() => !!sessionStore.user)

async function ensureHousehold() {
  await fetchHouseholds()
  if (sessionStore.user && households.value.length === 0) {
    await supabase.rpc('bootstrap_new_user')
    await fetchHouseholds()
  }
}

onMounted(async () => {
  await initAuth()
  if (sessionStore.user) {
    await ensureHousehold()
  }
})

watch(
  () => sessionStore.user?.id,
  async (userId) => {
    if (userId) {
      await ensureHousehold()
    }
  },
)
</script>

<template>
  <div class="mobile-shell">
    <AppHeader v-if="loggedIn" />
    <main class="mobile-main">
      <RouterView />
    </main>
    <BottomNavigation v-if="loggedIn" />
  </div>
</template>
