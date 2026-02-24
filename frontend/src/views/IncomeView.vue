<script setup lang="ts">
import { computed } from 'vue'
import { useHousehold } from '@/composables/useHousehold'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import { useAssetBreakdown } from '@/composables/useAssetBreakdown'

const { currentHouseholdId } = useHousehold()
const { categories } = useCategories(() => currentHouseholdId.value)
const { transactions, selectedMonth, totalIncome } = useTransactions(() => currentHouseholdId.value)
const { totalAssets } = useAssetBreakdown()

const monthInput = computed({
  get: () => selectedMonth.value.toISOString().slice(0, 7),
  set: (value: string) => {
    selectedMonth.value = new Date(`${value}-01T00:00:00`)
  },
})

const incomeByCategory = computed(() => {
  const map = new Map<string, number>()
  for (const tx of transactions.value) {
    if (tx.kind !== 'income') continue
    const name = categories.value.find((c) => c.id === tx.category_id)?.name ?? '未分類'
    map.set(name, (map.get(name) ?? 0) + Number(tx.amount))
  }
  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
})

const recommendedCapitalGainCategories = ['個別株キャピタルゲイン', '投資信託キャピタルゲイン']

</script>

<template>
  <main class="row" style="flex-direction: column;">
    <section class="card row" style="justify-content: space-between; align-items: center;">
      <h1 style="margin: 0;">収入</h1>
      <input v-model="monthInput" type="month" />
    </section>

    <section class="row">
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>総資産額</h3>
        <p>{{ totalAssets.toLocaleString() }} 円</p>
      </article>
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>今月の収入合計</h3>
        <p>{{ totalIncome.toLocaleString() }} 円</p>
      </article>
    </section>

    <section class="card">
      <h2>収入カテゴリ内訳（今月）</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th align="left">カテゴリ</th>
            <th align="left">金額</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in incomeByCategory" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.amount.toLocaleString() }} 円</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>キャピタルゲイン向け推奨カテゴリ</h2>
      <p style="margin-top: 0; color: #4b5563;">
        下記カテゴリを「カテゴリ管理」で作成すると、収入内訳が見やすくなります。
      </p>
      <div class="row">
        <span v-for="name in recommendedCapitalGainCategories" :key="name" class="card" style="padding: 0.5rem 0.75rem; border-style: dashed;">{{ name }}</span>
      </div>
    </section>
  </main>
</template>
