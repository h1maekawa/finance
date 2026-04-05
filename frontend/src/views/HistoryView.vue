<script setup lang="ts">
import { computed } from 'vue'
import { useTransactions } from '@/composables/useTransactions'
import { useHousehold } from '@/composables/useHousehold'

const { currentHouseholdId } = useHousehold()
const {
  transactions,
  loading,
  selectedMonth,
  totalIncome,
  totalExpense,
  balance,
  deleteTransaction,
} = useTransactions(() => currentHouseholdId.value)

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

const isCurrentMonth = computed(() => {
  const now = new Date()
  return selectedMonth.value.getFullYear() === now.getFullYear() &&
    selectedMonth.value.getMonth() === now.getMonth()
})

// Group by date
const grouped = computed(() => {
  const map = new Map<string, typeof transactions.value>()
  for (const tx of transactions.value) {
    const key = tx.transaction_date
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(tx)
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
})

function formatAmount(n: number) {
  return `¥${Math.abs(n).toLocaleString()}`
}

async function handleDelete(id: string) {
  if (!confirm('この取引を削除しますか？')) return
  await deleteTransaction(id)
}

function formatDate(s: string) {
  const d = new Date(s)
  return `${d.getMonth() + 1}月${d.getDate()}日（${['日','月','火','水','木','金','土'][d.getDay()]}）`
}
</script>

<template>
  <div class="space-y-5 pb-28">
    <section>
      <p class="font-label text-[11px] text-on-surface-variant font-semibold uppercase tracking-widest">收支管理</p>
      <h1 class="text-3xl font-extrabold tracking-tight text-on-surface font-headline mt-1">取引履歴</h1>
    </section>

    <!-- Month selector -->
    <div class="flex items-center justify-between bg-surface-container-lowest rounded-2xl px-4 py-3 border border-outline-variant/10">
      <button @click="prevMonth" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <span class="font-bold text-on-surface">{{ monthLabel }}</span>
      <button @click="nextMonth" :disabled="isCurrentMonth" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors disabled:opacity-30">
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>

    <!-- Summary bar -->
    <div class="grid grid-cols-3 gap-2">
      <div class="bg-surface-container-lowest rounded-2xl p-3 border border-outline-variant/10 text-center">
        <p class="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">収入</p>
        <p class="font-bold text-secondary text-sm mt-1">{{ formatAmount(totalIncome) }}</p>
      </div>
      <div class="bg-surface-container-lowest rounded-2xl p-3 border border-outline-variant/10 text-center">
        <p class="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">支出</p>
        <p class="font-bold text-tertiary text-sm mt-1">{{ formatAmount(totalExpense) }}</p>
      </div>
      <div class="bg-surface-container-lowest rounded-2xl p-3 border border-outline-variant/10 text-center">
        <p class="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">収支</p>
        <p :class="['font-bold text-sm mt-1', balance >= 0 ? 'text-secondary' : 'text-tertiary']">{{ balance >= 0 ? '+' : '-' }}{{ formatAmount(balance) }}</p>
      </div>
    </div>

    <!-- List -->
    <div v-if="loading" class="text-center py-10 text-on-surface-variant text-sm">読み込み中…</div>
    <div v-else-if="transactions.length === 0" class="text-center py-10 text-on-surface-variant text-sm bg-surface-container-lowest rounded-2xl">
      この月の取引はありません
    </div>
    <div v-else class="space-y-5">
      <div v-for="[date, txs] in grouped" :key="date" class="space-y-2">
        <p class="text-xs font-bold text-on-surface-variant px-1">{{ formatDate(date) }}</p>
        <div class="space-y-2">
          <div
            v-for="tx in txs"
            :key="tx.id"
            class="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/5 active:scale-[0.98] transition-transform"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div :class="['w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0', tx.kind === 'income' ? 'bg-secondary-container' : 'bg-primary-fixed']">
                <span class="material-symbols-outlined text-[18px]" :class="tx.kind === 'income' ? 'text-on-secondary-container' : 'text-on-primary-fixed-variant'" style="font-variation-settings: 'FILL' 1;">
                  {{ tx.kind === 'income' ? 'arrow_downward' : 'arrow_upward' }}
                </span>
              </div>
              <p class="font-medium text-on-surface text-sm truncate">{{ tx.note || '取引' }}</p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <p :class="['font-bold text-sm', tx.kind === 'income' ? 'text-secondary' : 'text-tertiary']">
                {{ tx.kind === 'income' ? '+' : '-' }}{{ formatAmount(tx.amount) }}
              </p>
              <button @click="handleDelete(tx.id)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
                <span class="material-symbols-outlined text-[16px] text-on-surface-variant">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB -->
    <router-link to="/entry" class="fixed bottom-28 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform duration-200">
      <span class="material-symbols-outlined text-2xl">add</span>
    </router-link>
  </div>
</template>
