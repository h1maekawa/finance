<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { sessionStore } from '@/stores/session'
import { useHousehold } from '@/composables/useHousehold'
import { useTransactions } from '@/composables/useTransactions'
import { useAccounts } from '@/composables/useAccounts'

const router = useRouter()
const { currentHouseholdId, currentHousehold, fetchHouseholds } = useHousehold()
const { transactions, totalIncome, totalExpense, balance, loading: txLoading, fetchTransactions } = useTransactions(() => currentHouseholdId.value)
const { accounts, totalBalance, fetchAccounts } = useAccounts(() => currentHouseholdId.value)

onMounted(async () => {
  await fetchHouseholds()
  await fetchTransactions()
  await fetchAccounts()
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'おはようございます'
  if (h < 18) return 'こんにちは'
  return 'こんばんは'
})

const userName = computed(() => {
  const u = sessionStore.user
  return u?.name?.split(' ')[0] || u?.email?.split('@')[0] || 'あなた'
})

const recentTransactions = computed(() => transactions.value.slice(0, 5))

const now = new Date()
const monthLabel = computed(() => `${now.getFullYear()}年${now.getMonth() + 1}月`)

const budgetUsagePercent = computed(() => {
  if (totalExpense.value === 0) return 0
  // rough: assume monthly income is budget ceiling
  if (totalIncome.value === 0) return 0
  return Math.min(100, Math.round((totalExpense.value / totalIncome.value) * 100))
})
const ringOffset = computed(() => {
  const circumference = 2 * Math.PI * 52
  return circumference - (budgetUsagePercent.value / 100) * circumference
})
const ringCircumference = 2 * Math.PI * 52

function formatAmount(n: number) {
  return `¥${Math.abs(n).toLocaleString()}`
}

const categoryIconMap: Record<string, string> = {
  '食費': 'restaurant',
  '日用品': 'local_grocery_store',
  '交通費': 'directions_bus',
  '家賃': 'home',
  '光熱費': 'bolt',
  '娯楽': 'movie',
  '医療': 'local_hospital',
  '衣類': 'checkroom',
  '給料': 'payments',
  '副収入': 'account_balance_wallet',
}

function getIcon(note: string | null) {
  for (const [k, v] of Object.entries(categoryIconMap)) {
    if (note?.includes(k)) return v
  }
  return 'receipt_long'
}
</script>

<template>
  <div class="space-y-6 pb-28">
    <!-- Welcome -->
    <section>
      <p class="font-label text-[11px] text-on-surface-variant font-semibold uppercase tracking-widest">{{ greeting }}、{{ userName }}さん</p>
      <h1 class="text-3xl font-extrabold tracking-tight text-on-surface font-headline mt-1">{{ currentHousehold?.name || '家計の概況' }}</h1>
    </section>

    <!-- Summary Card -->
    <div class="bg-surface-container-lowest rounded-[2rem] p-6 shadow-sm border border-outline-variant/10 space-y-5">
      <div class="flex justify-between items-start">
        <div>
          <p class="font-label text-[11px] text-on-surface-variant font-medium">{{ monthLabel }}の収支</p>
          <p :class="['text-4xl font-extrabold tracking-tighter leading-none mt-1', balance >= 0 ? 'text-secondary' : 'text-tertiary']">
            {{ balance >= 0 ? '+' : '-' }}{{ formatAmount(balance) }}
          </p>
        </div>
        <div class="text-right">
          <p class="font-label text-[11px] text-on-surface-variant font-medium">総資産</p>
          <p class="text-xl font-bold text-primary mt-1">{{ formatAmount(totalBalance) }}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-surface-container-low p-4 rounded-2xl space-y-1">
          <div class="flex items-center gap-1 text-secondary">
            <span class="material-symbols-outlined text-[16px]">arrow_downward</span>
            <span class="text-[11px] font-bold uppercase tracking-wider font-label">収入</span>
          </div>
          <p class="text-lg font-bold text-on-surface">{{ formatAmount(totalIncome) }}</p>
        </div>
        <div class="bg-surface-container-low p-4 rounded-2xl space-y-1">
          <div class="flex items-center gap-1 text-tertiary">
            <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
            <span class="text-[11px] font-bold uppercase tracking-wider font-label">支出</span>
          </div>
          <p class="text-lg font-bold text-on-surface">{{ formatAmount(totalExpense) }}</p>
        </div>
      </div>
    </div>

    <!-- Budget Ring -->
    <div class="bg-surface-container-lowest rounded-[2rem] p-6 shadow-sm border border-outline-variant/10 flex items-center gap-6">
      <div class="relative w-32 h-32 flex-shrink-0">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle class="text-surface-container-high" stroke-width="10" stroke="currentColor" fill="transparent" r="52" cx="60" cy="60" />
          <circle
            class="text-primary transition-all duration-1000 ease-out"
            stroke-width="10"
            :stroke-dasharray="ringCircumference"
            :stroke-dashoffset="ringOffset"
            stroke-linecap="round"
            stroke="currentColor"
            fill="transparent"
            r="52"
            cx="60"
            cy="60"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-2xl font-extrabold text-on-surface">{{ budgetUsagePercent }}%</span>
          <span class="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest font-label">使用済み</span>
        </div>
      </div>
      <div>
        <h3 class="font-bold text-base font-headline">収入に対する支出率</h3>
        <p class="text-sm text-on-surface-variant font-body mt-1 leading-relaxed">
          今月は収入の {{ budgetUsagePercent }}% を支出しています。
        </p>
        <router-link to="/reports" class="text-primary text-sm font-bold mt-2 inline-block">詳細分析 →</router-link>
      </div>
    </div>

    <!-- Recent Transactions -->
    <section class="space-y-4">
      <div class="flex justify-between items-end">
        <h2 class="text-xl font-bold tracking-tight font-headline">最近の取引</h2>
        <router-link to="/cashflow" class="text-primary font-bold text-sm">すべて見る</router-link>
      </div>

      <div v-if="txLoading" class="text-center py-8 text-on-surface-variant text-sm">読み込み中…</div>
      <div v-else-if="recentTransactions.length === 0" class="text-center py-8 text-on-surface-variant text-sm bg-surface-container-lowest rounded-2xl">
        今月の取引はまだありません
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="tx in recentTransactions"
          :key="tx.id"
          class="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/5 active:scale-[0.98] transition-transform duration-200"
        >
          <div class="flex items-center gap-3">
            <div :class="['w-11 h-11 flex items-center justify-center rounded-2xl', tx.kind === 'income' ? 'bg-secondary-container' : 'bg-primary-fixed']">
              <span class="material-symbols-outlined text-[20px]" :class="tx.kind === 'income' ? 'text-on-secondary-container' : 'text-on-primary-fixed-variant'" style="font-variation-settings: 'FILL' 1;">
                {{ getIcon(tx.note) }}
              </span>
            </div>
            <div>
              <p class="font-bold text-on-surface text-sm">{{ tx.note || '取引' }}</p>
              <p class="text-xs text-on-surface-variant">{{ tx.transaction_date }}</p>
            </div>
          </div>
          <p :class="['font-bold text-sm', tx.kind === 'income' ? 'text-secondary' : 'text-tertiary']">
            {{ tx.kind === 'income' ? '+' : '-' }}{{ formatAmount(tx.amount) }}
          </p>
        </div>
      </div>
    </section>

    <!-- FAB -->
    <router-link to="/entry" class="fixed bottom-28 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform duration-200">
      <span class="material-symbols-outlined text-2xl">add</span>
    </router-link>
  </div>
</template>
