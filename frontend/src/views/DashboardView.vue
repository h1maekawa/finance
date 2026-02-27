<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { useHousehold } from '@/composables/useHousehold'
import { useTransactions } from '@/composables/useTransactions'
import { useAccounts } from '@/composables/useAccounts'
import { useInvestments } from '@/composables/useInvestments'

ChartJS.register(ArcElement, Tooltip, Legend)

const { currentHouseholdId } = useHousehold()
const {
  selectedMonth,
  totalIncome,
  totalExpense,
} = useTransactions(() => currentHouseholdId.value)
const { accounts, totalBalance } = useAccounts(() => currentHouseholdId.value)
const { investments, totalInvestments, getCurrentAmount } = useInvestments(() => currentHouseholdId.value)

const grandTotal = computed(() => totalBalance.value + totalInvestments.value)

const monthInput = computed({
  get: () => selectedMonth.value.toISOString().slice(0, 7),
  set: (value: string) => {
    selectedMonth.value = new Date(`${value}-01T00:00:00`)
  },
})

const daysLeftInMonth = computed(() => {
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const left = last.getDate() - now.getDate() + 1
  return Math.max(1, left)
})

const todaySpendable = computed(() => {
  const allowance = totalIncome.value - totalExpense.value
  if (allowance <= 0) return 0
  return Math.floor(allowance / daysLeftInMonth.value)
})

const todaySpendableMessage = computed(() =>
  todaySpendable.value > 0 ? '余裕があります！' : '貯金目標のため今日は節制を',
)


// --- Pie chart data ---
const chartColors = [
  '#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe',
  '#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe',
]

const chartData = computed(() => {
  const labels: string[] = []
  const data: number[] = []
  const bgColors: string[] = []
  let colorIdx = 0

  for (const a of accounts.value) {
    if (a.balance > 0) {
      labels.push(a.institution_name)
      data.push(a.balance)
      bgColors.push(chartColors[colorIdx % chartColors.length])
      colorIdx++
    }
  }
  for (const inv of investments.value) {
    const currentAmount = getCurrentAmount(inv)
    if (currentAmount > 0) {
      labels.push(`${inv.name}`)
      data.push(currentAmount)
      bgColors.push(chartColors[colorIdx % chartColors.length])
      colorIdx++
    }
  }

  if (data.length === 0) {
    labels.push('データなし')
    data.push(1)
    bgColors.push('#e5e7eb')
  }

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: bgColors,
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        boxWidth: 12,
        padding: 12,
        font: { size: 11 },
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: { label: string; parsed: number }) =>
          `${ctx.label}: ${ctx.parsed.toLocaleString()} 円`,
      },
    },
  },
}

</script>

<template>
  <main class="dashboard">
    <!-- 総資産ヒーロー -->
    <section class="dashboard__hero">
      <p class="dashboard__hero-label">総資産</p>
      <p class="dashboard__hero-amount">{{ grandTotal.toLocaleString() }}<span class="dashboard__hero-unit">円</span></p>
      <div class="dashboard__hero-sub">
        <span>🏦 口座 {{ totalBalance.toLocaleString() }}円</span>
        <span>📊 資産 {{ totalInvestments.toLocaleString() }}円</span>
      </div>
    </section>

    <!-- 円グラフ -->
    <section class="dashboard__section">
      <h2 class="dashboard__heading">資産内訳</h2>
      <div class="dashboard__chart-wrapper">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
    </section>

    <section class="dashboard__section dashboard__section--highlight">
      <h2 class="dashboard__heading">今日使っていい金額</h2>
      <p class="dashboard__today-amount">{{ todaySpendable.toLocaleString() }}円</p>
      <p class="dashboard__today-message">{{ todaySpendableMessage }}</p>
    </section>

    <section class="dashboard__summary-grid">
      <article class="dashboard__summary-card">
        <h2 class="dashboard__summary-label">今月の収入合計</h2>
        <p class="dashboard__summary-value dashboard__summary-value--income">{{ totalIncome.toLocaleString() }}円</p>
      </article>
      <article class="dashboard__summary-card">
        <h2 class="dashboard__summary-label">今月の支出合計</h2>
        <p class="dashboard__summary-value dashboard__summary-value--expense">{{ totalExpense.toLocaleString() }}円</p>
      </article>
    </section>

    <section class="dashboard__section dashboard__section--month-picker">
      <label class="dashboard__month-label">表示月</label>
      <input v-model="monthInput" type="month" class="dashboard__month-input" />
    </section>
  </main>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

.dashboard__hero {
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%);
  color: #fff;
  border-radius: 20px;
  padding: 2rem 1.5rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.3);
}

.dashboard__hero-label {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.9;
}

.dashboard__hero-amount {
  margin: 0;
  font-size: 2.75rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.dashboard__hero-unit {
  font-size: 1.25rem;
  font-weight: 700;
  margin-left: 0.15rem;
}

.dashboard__hero-sub {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  opacity: 0.9;
}

.dashboard__section {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.dashboard__section--highlight {
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
  color: #fff;
}

.dashboard__section--month-picker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dashboard__heading {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.dashboard__section--highlight .dashboard__heading {
  color: rgba(255, 255, 255, 0.9);
}

.dashboard__chart-wrapper {
  position: relative;
  height: 280px;
}

.dashboard__today-amount {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.dashboard__today-message {
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
  opacity: 0.95;
}

.dashboard__summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.dashboard__summary-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
}

.dashboard__summary-label {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.dashboard__summary-value {
  margin: 0.35rem 0 0;
  font-size: 1.2rem;
  font-weight: 800;
}

.dashboard__summary-value--income {
  color: #059669;
}

.dashboard__summary-value--expense {
  color: #dc2626;
}

.dashboard__month-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.dashboard__month-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font: inherit;
}
</style>
