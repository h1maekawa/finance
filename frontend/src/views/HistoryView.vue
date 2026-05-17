<template>
  <div class="page-content">
    <!-- Header -->
    <div class="history-header">
      <h1 class="page-title">取引履歴</h1>
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

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="groupedByDate.length === 0" class="empty-state">
      <span class="material-symbols-rounded">receipt_long</span>
      <p>この月の取引はありません</p>
    </div>

    <div v-else class="history-list">
      <div v-for="[date, txs] in groupedByDate" :key="date" class="date-group">
        <div class="date-header">
          <span class="date-label">{{ formatDate(date) }}</span>
          <span class="date-summary">
            {{ formatDayTotal(txs) }}
          </span>
        </div>
        <div class="tx-list">
          <TransactionCard
            v-for="tx in txs"
            :key="tx.id"
            :transaction="tx"
            :icon="getCategoryIcon(tx.category)"
            :show-delete="true"
            @delete="handleDelete"
          />
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import BottomNav from '@/components/BottomNav.vue'
import TransactionCard from '@/components/TransactionCard.vue'
import type { Transaction } from '@/types'

const { user } = useAuth()
const uid = user.value!.uid

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)

const { loading, groupedByDate, fetchByMonth, deleteTransaction } = useTransactions(uid)
const { categories, fetchCategories } = useCategories(uid)

onMounted(async () => {
  await fetchCategories()
  await fetchByMonth(currentYear.value, currentMonth.value)
})

watch([currentYear, currentMonth], ([y, m]) => fetchByMonth(y, m))

const currentMonthLabel = computed(() => `${currentYear.value}年${currentMonth.value}月`)

const changeMonth = (delta: number) => {
  let m = currentMonth.value + delta
  let y = currentYear.value
  if (m > 12) { m = 1; y++ }
  if (m < 1) { m = 12; y-- }
  currentMonth.value = m
  currentYear.value = y
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
}

const formatDayTotal = (txs: Transaction[]) => {
  const income = txs.filter(t => t.kind === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter(t => t.kind === 'expense').reduce((s, t) => s + t.amount, 0)
  const parts = []
  if (income > 0) parts.push(`+${fmt(income)}`)
  if (expense > 0) parts.push(`-${fmt(expense)}`)
  return parts.join(' / ')
}

const fmt = (n: number) => new Intl.NumberFormat('ja-JP').format(n) + '円'

const getCategoryIcon = (name: string) => {
  const cat = categories.value.find(c => c.name === name)
  return cat?.icon ?? 'category'
}

const handleDelete = async (id: string) => {
  await deleteTransaction(id)
}
</script>

<style scoped>
.history-header {
  background: var(--color-surface);
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.month-btn {
  background: var(--color-bg);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text);
  transition: background 0.2s;
}
.month-btn:hover { background: var(--color-border); }

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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-muted);
}
.empty-state .material-symbols-rounded {
  font-size: 56px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.3;
}

.history-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.date-group {}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
  margin-bottom: 8px;
}

.date-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.date-summary {
  font-size: 12px;
  color: var(--color-text-muted);
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
