<script setup lang="ts">
import { computed, ref } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
} from 'chart.js'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import { useHousehold } from '@/composables/useHousehold'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const { currentHouseholdId } = useHousehold()
const { transactions, selectedMonth, totalExpense, totalIncome } = useTransactions(() => currentHouseholdId.value)
const { categories } = useCategories(() => currentHouseholdId.value)

const activeTab = ref<'expense' | 'income'>('expense')

const monthLabel = computed(() => {
  const d = selectedMonth.value
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
})

function prevMonth() {
  const d = new Date(selectedMonth.value)
  d.setMonth(d.getMonth() - 1)
  selectedMonth.value = d
}
function nextMonth() {
  const d = new Date(selectedMonth.value)
  d.setMonth(d.getMonth() + 1)
  selectedMonth.value = d
}

const PALETTE = [
  '#0040a1', '#1b6d24', '#940010', '#4338ca', '#0f766e',
  '#b45309', '#7c3aed', '#0369a1', '#be185d', '#065f46',
]

const categoryBreakdown = computed(() => {
  const filtered = transactions.value.filter(t => t.kind === activeTab.value)
  const catMap = new Map<string, number>()
  for (const tx of filtered) {
    const cur = catMap.get(tx.category_id) || 0
    catMap.set(tx.category_id, cur + Number(tx.amount))
  }

  return [...catMap.entries()]
    .map(([catId, amount]) => {
      const cat = categories.value.find(c => c.id === catId)
      return { catId, name: cat?.name || '不明', amount }
    })
    .sort((a, b) => b.amount - a.amount)
})

const chartData = computed(() => ({
  labels: categoryBreakdown.value.map(c => c.name),
  datasets: [{
    data: categoryBreakdown.value.map(c => c.amount),
    backgroundColor: PALETTE.slice(0, categoryBreakdown.value.length),
    borderWidth: 0,
    hoverOffset: 6,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ¥${ctx.raw.toLocaleString()}`,
      },
    },
  },
  cutout: '68%',
}

const total = computed(() => activeTab.value === 'expense' ? totalExpense.value : totalIncome.value)

function pct(amount: number) {
  if (total.value === 0) return 0
  return Math.round((amount / total.value) * 100)
}

function fmt(n: number) {
  return `¥${n.toLocaleString()}`
}
</script>

<template>
  <div class="space-y-5 pb-28">
    <section>
      <p class="font-label text-[11px] text-on-surface-variant font-semibold uppercase tracking-widest">データ分析</p>
      <h1 class="text-3xl font-extrabold tracking-tight text-on-surface font-headline mt-1">カテゴリ分析</h1>
    </section>

    <!-- Month selector -->
    <div class="flex items-center justify-between bg-surface-container-lowest rounded-2xl px-4 py-3 border border-outline-variant/10">
      <button @click="prevMonth" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <span class="font-bold text-on-surface">{{ monthLabel }}</span>
      <button @click="nextMonth" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>

    <!-- Tab toggle -->
    <div class="flex bg-surface-container rounded-2xl p-1 gap-1">
      <button
        @click="activeTab = 'expense'"
        :class="['flex-1 py-2 rounded-xl text-sm font-bold transition-all', activeTab === 'expense' ? 'bg-surface-container-lowest shadow text-on-surface' : 'text-on-surface-variant']"
      >支出</button>
      <button
        @click="activeTab = 'income'"
        :class="['flex-1 py-2 rounded-xl text-sm font-bold transition-all', activeTab === 'income' ? 'bg-surface-container-lowest shadow text-on-surface' : 'text-on-surface-variant']"
      >収入</button>
    </div>

    <!-- Doughnut chart -->
    <div class="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
      <div v-if="categoryBreakdown.length === 0" class="flex flex-col items-center justify-center h-52 text-on-surface-variant text-sm">
        <span class="material-symbols-outlined text-4xl mb-2 opacity-30">pie_chart</span>
        データがありません
      </div>
      <div v-else>
        <div class="relative h-52 mx-auto" style="max-width: 210px;">
          <Doughnut :data="chartData" :options="chartOptions" />
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label">合計</p>
            <p class="text-xl font-extrabold text-on-surface mt-0.5">{{ fmt(total) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Category list -->
    <div class="space-y-2">
      <div
        v-for="(cat, i) in categoryBreakdown"
        :key="cat.catId"
        class="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/10"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full" :style="`background:${PALETTE[i]}`" />
            <span class="font-bold text-on-surface text-sm">{{ cat.name }}</span>
          </div>
          <div class="text-right">
            <span class="font-bold text-on-surface text-sm">{{ fmt(cat.amount) }}</span>
            <span class="text-xs text-on-surface-variant ml-2">{{ pct(cat.amount) }}%</span>
          </div>
        </div>
        <div class="w-full bg-surface-container-high rounded-full h-1.5">
          <div class="h-1.5 rounded-full transition-all duration-700" :style="`width:${pct(cat.amount)}%; background:${PALETTE[i]}`" />
        </div>
      </div>
    </div>
  </div>
</template>
