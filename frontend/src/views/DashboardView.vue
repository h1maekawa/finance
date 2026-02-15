<script setup lang="ts">
import { computed } from 'vue'
import ExpensePieChart from '@/components/charts/ExpensePieChart.vue'
import MonthlyBarChart from '@/components/charts/MonthlyBarChart.vue'
import { useHousehold } from '@/composables/useHousehold'
import { useTransactions } from '@/composables/useTransactions'
import { useMonthlySummary } from '@/composables/useMonthlySummary'
import { useCategories } from '@/composables/useCategories'

const { currentHouseholdId } = useHousehold()
const {
  transactions,
  selectedMonth,
  totalIncome,
  totalExpense,
  balance,
} = useTransactions(() => currentHouseholdId.value)
const { categories } = useCategories(() => currentHouseholdId.value)
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
</script>

<template>
  <main class="row" style="flex-direction: column;">
    <section class="card row" style="justify-content: space-between; align-items: center;">
      <h1 style="margin: 0;">月次サマリー</h1>
      <input v-model="monthInput" type="month" />
    </section>

    <section class="row">
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>収入</h3>
        <p>{{ totalIncome.toLocaleString() }} 円</p>
      </article>
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>支出</h3>
        <p>{{ totalExpense.toLocaleString() }} 円</p>
      </article>
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>収支</h3>
        <p>{{ balance.toLocaleString() }} 円</p>
      </article>
    </section>

    <section class="row">
      <ExpensePieChart :chart-data="summary.pieData.value" />
      <MonthlyBarChart :chart-data="summary.barData.value" />
    </section>
  </main>
</template>
