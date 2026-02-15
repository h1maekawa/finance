<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useHousehold } from '@/composables/useHousehold'

const { signOut } = useAuth()
const { households, currentHouseholdId, setCurrentHousehold } = useHousehold()
</script>

<template>
  <header class="card" style="margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
    <div class="row" style="align-items: center;">
      <strong>家計簿</strong>
      <RouterLink to="/">ダッシュボード</RouterLink>
      <RouterLink to="/transactions">取引</RouterLink>
      <RouterLink to="/categories">カテゴリ</RouterLink>
    </div>
    <div class="row" style="align-items: center;">
      <select :value="currentHouseholdId ?? ''" @change="setCurrentHousehold(($event.target as HTMLSelectElement).value)">
        <option v-for="h in households" :key="h.id" :value="h.id">{{ h.name }}</option>
      </select>
      <button @click="signOut">ログアウト</button>
    </div>
  </header>
</template>
