<template>
  <div class="page-content">
    <!-- Header -->
    <div class="home-header">
      <div class="header-top">
        <div>
          <p class="greeting">こんにちは！</p>
          <h2 class="month-label">{{ currentMonthLabel }}</h2>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <span class="material-symbols-rounded">logout</span>
        </button>
      </div>
      <div class="month-nav">
        <button class="month-btn" @click="changeMonth(-1)">
          <span class="material-symbols-rounded">chevron_left</span>
        </button>
        <span class="month-text">{{ currentMonthLabel }}</span>
        <button class="month-btn" @click="changeMonth(1)">
          <span class="material-symbols-rounded">chevron_right</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card income">
          <span class="material-symbols-rounded card-icon">trending_up</span>
          <div>
            <p class="card-label">収入</p>
            <p class="card-amount">{{ formatAmount(summary.income) }}</p>
          </div>
        </div>
        <div class="summary-card expense">
          <span class="material-symbols-rounded card-icon">trending_down</span>
          <div>
            <p class="card-label">支出</p>
            <p class="card-amount">{{ formatAmount(summary.expense) }}</p>
          </div>
        </div>
        <div class="summary-card balance" :class="summary.balance >= 0 ? 'positive' : 'negative'">
          <span class="material-symbols-rounded card-icon">account_balance</span>
          <div>
            <p class="card-label">残高</p>
            <p class="card-amount">{{ formatAmount(summary.balance) }}</p>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div v-if="Object.keys(categoryExpenses).length > 0" class="section">
        <h3 class="section-title">カテゴリ別支出</h3>
        <div class="chart-container">
          <Doughnut :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Recent transactions -->
      <div class="section">
        <h3 class="section-title">最近の取引</h3>
        <div v-if="recentTransactions.length === 0" class="empty-state">
          <span class="material-symbols-rounded">receipt_long</span>
          <p>取引がありません</p>
        </div>
        <div v-else class="tx-list">
          <TransactionCard
            v-for="tx in recentTransactions"
            :key="tx.id"
            :transaction="tx"
            :icon="getCategoryIcon(tx.category)"
          />
        </div>
      </div>
    </template>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useAuth } from '@/composables/useAuth'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import BottomNav from '@/components/BottomNav.vue'
import TransactionCard from '@/components/TransactionCard.vue'

ChartJS.register(ArcElement, Tooltip, Legend)

const router = useRouter()
const { user, logout } = useAuth()
const uid = user.value!.uid

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)

const { transactions, loading, summary, recentTransactions, categoryExpenses, fetchByMonth } =
  useTransactions(uid)
const { categories, fetchCategories } = useCategories(uid)

onMounted(async () => {
  await fetchCategories()
  await fetchByMonth(currentYear.value, currentMonth.value)
})

watch([currentYear, currentMonth], ([y, m]) => {
  fetchByMonth(y, m)
})

const currentMonthLabel = computed(
  () => `${currentYear.value}年${currentMonth.value}月`,
)

const changeMonth = (delta: number) => {
  let m = currentMonth.value + delta
  let y = currentYear.value
  if (m > 12) { m = 1; y++ }
  if (m < 1) { m = 12; y-- }
  currentMonth.value = m
  currentYear.value = y
}

const formatAmount = (n: number) =>
  (n < 0 ? '-' : '') + new Intl.NumberFormat('ja-JP').format(Math.abs(n)) + '円'

const getCategoryIcon = (name: string) => {
  const cat = categories.value.find((c) => c.name === name)
  return cat?.icon ?? 'category'
}

const CHART_COLORS = [
  '#1a56db', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

const chartData = computed(() => {
  const labels = Object.keys(categoryExpenses.value)
  const data = Object.values(categoryExpenses.value)
  return {
    labels,
    datasets: [{
      data,
      backgroundColor: CHART_COLORS.slice(0, labels.length),
      borderWidth: 0,
    }],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'bottom' as const, labels: { font: { family: 'Noto Sans JP', size: 12 } } },
  },
}

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>

<style scoped>
.home-header {
  background: linear-gradient(135deg, #1a56db 0%, #0e3fa8 100%);
  color: white;
  padding: 20px 20px 28px;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.greeting {
  font-size: 14px;
  opacity: 0.8;
}

.month-label {
  font-size: 22px;
  font-weight: 700;
}

.logout-btn {
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 10px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.month-btn {
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background 0.2s;
}
.month-btn:hover { background: rgba(255,255,255,0.25); }

.month-text {
  font-size: 16px;
  font-weight: 600;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.summary-card:last-child {
  grid-column: 1 / -1;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.summary-card.income .card-icon { color: var(--color-income); background: rgba(16, 185, 129, 0.1); }
.summary-card.expense .card-icon { color: var(--color-expense); background: rgba(239, 68, 68, 0.1); }
.summary-card.positive .card-icon { color: var(--color-income); background: rgba(16, 185, 129, 0.1); }
.summary-card.negative .card-icon { color: var(--color-expense); background: rgba(239, 68, 68, 0.1); }

.card-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 2px;
}

.card-amount {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.summary-card.income .card-amount { color: var(--color-income); }
.summary-card.expense .card-amount { color: var(--color-expense); }

.section {
  padding: 0 16px 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 12px;
}

.chart-container {
  max-width: 260px;
  margin: 0 auto;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-muted);
}

.empty-state .material-symbols-rounded {
  font-size: 48px;
  display: block;
  margin-bottom: 8px;
  opacity: 0.4;
}
</style>
