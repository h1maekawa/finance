<script setup lang="ts">
import { computed } from 'vue'
import ExpensePieChart from '@/components/charts/ExpensePieChart.vue'
import { useHousehold } from '@/composables/useHousehold'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import { useMonthlySummary } from '@/composables/useMonthlySummary'

const { currentHouseholdId } = useHousehold()
const { categories } = useCategories(() => currentHouseholdId.value)
const { transactions, selectedMonth, totalExpense } = useTransactions(() => currentHouseholdId.value)

const summary = useMonthlySummary(
  () => transactions.value,
  (categoryId) => categories.value.find((c) => c.id === categoryId)?.name ?? '未分類',
)

const monthInput = computed({
  get: () => selectedMonth.value.toISOString().slice(0, 7),
  set: (value: string) => {
    selectedMonth.value = new Date(`${value}-01T00:00:00`)
  },
})

const expenseByCategory = computed(() => {
  const map = new Map<string, number>()
  for (const tx of transactions.value) {
    if (tx.kind !== 'expense') continue
    const name = categories.value.find((c) => c.id === tx.category_id)?.name ?? '未分類'
    map.set(name, (map.get(name) ?? 0) + Number(tx.amount))
  }
  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
})
</script>

<template>
  <main class="row" style="flex-direction: column;">
    <section class="card row" style="justify-content: space-between; align-items: center;">
      <h1 style="margin: 0;">支出</h1>
      <input v-model="monthInput" type="month" />
    </section>

    <section class="row">
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>今月の支出合計</h3>
        <p>{{ totalExpense.toLocaleString() }} 円</p>
      </article>
    </section>

    <section class="row">
      <ExpensePieChart :chart-data="summary.pieData.value" />
      <article class="card" style="flex: 1; min-width: 320px;">
        <h3>カテゴリ別支出（今月）</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th align="left">カテゴリ</th>
              <th align="left">金額</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in expenseByCategory" :key="row.name">
              <td>{{ row.name }}</td>
              <td>{{ row.amount.toLocaleString() }} 円</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>
  </main>
</template>
