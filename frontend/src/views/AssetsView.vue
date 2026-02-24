<script setup lang="ts">
import { computed } from 'vue'
import { useAssetBreakdown } from '@/composables/useAssetBreakdown'

const { state, totalAssets, update } = useAssetBreakdown()

const rows = computed(() => [
  { key: 'stocks', label: '個別株' },
  { key: 'funds', label: '投資信託' },
  { key: 'cash', label: '現金' },
  { key: 'account', label: '口座' },
] as const)

function onInput(key: 'stocks' | 'funds' | 'cash' | 'account', value: string) {
  const parsed = Number(value)
  update({ [key]: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0 })
}
</script>

<template>
  <main class="row" style="flex-direction: column;">
    <section class="card">
      <h1>現預貯金</h1>
      <p style="margin-top: 0; color: #6b7280;">総資産の内訳を管理します。</p>
      <div class="row" style="flex-direction: column;">
        <label v-for="row in rows" :key="row.key" style="display: flex; flex-direction: column; gap: 0.4rem;">
          <span style="font-weight: 600;">{{ row.label }}</span>
          <input
            :value="state[row.key]"
            type="number"
            min="0"
            step="1"
            @input="onInput(row.key, ($event.target as HTMLInputElement).value)"
          />
        </label>
      </div>
    </section>

    <section class="card">
      <h2>総資産額</h2>
      <p style="font-size: 1.8rem; font-weight: 700; margin: 0;">{{ totalAssets.toLocaleString() }} 円</p>
    </section>
  </main>
</template>
