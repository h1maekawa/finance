<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useHousehold } from '@/composables/useHousehold'
import { useTransactions } from '@/composables/useTransactions'
import { useAccounts } from '@/composables/useAccounts'
import { useStocks } from '@/composables/useStocks'

const { sessionStore } = useAuth()
const { currentHouseholdId } = useHousehold()
const { 
  transactions, 
  totalIncome, 
  totalExpense, 
  balance: monthlyBalance,
  loading: txLoading 
} = useTransactions(() => currentHouseholdId.value)

const { totalBalance: bankBalance, loading: accountLoading } = useAccounts(() => currentHouseholdId.value)
const { totalEvaluationAmount: stockBalance, loading: stockLoading } = useStocks()

const totalAssets = computed(() => bankBalance.value + stockBalance.value)
const userName = computed(() => sessionStore.user?.name || 'ゲスト')

const recentTransactions = computed(() => transactions.value.slice(0, 3))

const isLoading = computed(() => txLoading.value || accountLoading.value || stockLoading.value)

// Formatters
const fmt = (n: number) => `¥${Math.floor(n).toLocaleString()}`
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return '今日'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// Category Icons & Colors
const categoryInfo: Record<string, { icon: string; color: string }> = {
  '食費': { icon: 'restaurant', color: 'bg-primary-fixed' },
  '日用品': { icon: 'shopping_bag', color: 'bg-secondary-container' },
  '交通費': { icon: 'train', color: 'bg-tertiary-fixed' },
  '交際費': { icon: 'celebration', color: 'bg-primary-container' },
  'エンタメ': { icon: 'movie', color: 'bg-secondary-fixed' },
  'default': { icon: 'payments', color: 'bg-surface-container-high' }
}

const getCategoryStyle = (note: string) => {
  if (note.includes('ライフ') || note.includes('スーパー')) return categoryInfo['食費']
  if (note.includes('Netflix') || note.includes('映画')) return categoryInfo['エンタメ']
  return categoryInfo['default']
}
</script>

<template>
  <div class="space-y-8 pb-32 animate-in fade-in duration-700">
    <!-- Welcome Section -->
    <section class="space-y-1 px-1">
      <p class="text-premium-label transition-all">{{ userName }}さん、おはようございます</p>
      <h1 class="text-premium-headline text-3xl">家計の概況</h1>
    </section>

    <!-- Bento Grid Main Content -->
    <div class="grid grid-cols-1 gap-6">
      <!-- Summary Card (Editorial Style) -->
      <div class="card-premium relative overflow-hidden group">
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
        
        <div class="flex justify-between items-start relative z-10">
          <div class="space-y-1">
            <p class="text-premium-label">今月の収支残高</p>
            <p class="text-4xl font-extrabold text-primary tracking-tighter leading-none py-1">
              {{ isLoading ? '---' : fmt(monthlyBalance) }}
            </p>
          </div>
          <div v-if="!isLoading" :class="['px-3 py-1 rounded-full text-[12px] font-bold transition-transform hover:scale-105', monthlyBalance >= 0 ? 'bg-secondary-fixed text-on-secondary-container' : 'bg-error-container text-on-error-container']">
            {{ monthlyBalance >= 0 ? '+' : '' }}{{ Math.round((monthlyBalance / (totalIncome || 1)) * 100) }}%
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-8 relative z-10">
          <div class="bg-surface-container-low/50 p-5 rounded-[1.5rem] space-y-2 border border-outline-variant/5">
            <div class="flex items-center gap-2 text-secondary">
              <span class="material-symbols-outlined text-[18px]">arrow_downward</span>
              <span class="text-premium-label !text-secondary opacity-80">今月の収入</span>
            </div>
            <p class="text-xl font-bold text-on-surface">{{ isLoading ? '---' : fmt(totalIncome) }}</p>
          </div>
          <div class="bg-surface-container-low/50 p-5 rounded-[1.5rem] space-y-2 border border-outline-variant/5">
            <div class="flex items-center gap-2 text-tertiary">
              <span class="material-symbols-outlined text-[18px]">arrow_upward</span>
              <span class="text-premium-label !text-tertiary opacity-80">今月の支出</span>
            </div>
            <p class="text-xl font-bold text-on-surface">{{ isLoading ? '---' : fmt(totalExpense) }}</p>
          </div>
        </div>
      </div>

      <!-- Assets Card -->
      <div class="card-premium flex flex-col space-y-6 relative overflow-hidden">
        <div class="absolute -left-8 -bottom-8 w-40 h-40 bg-secondary/5 rounded-full blur-3xl"></div>

        <div class="flex justify-between items-center relative z-10">
          <h3 class="text-premium-headline text-lg">総資産額</h3>
          <router-link to="/assets" class="text-primary font-bold text-sm hov-underline">明細を見る</router-link>
        </div>

        <div class="text-center py-4 relative z-10">
          <p class="text-5xl font-black text-on-surface tracking-tighter">{{ isLoading ? '---' : fmt(totalAssets) }}</p>
          <div class="flex items-center justify-center gap-4 mt-4 text-sm font-medium text-on-surface-variant">
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-primary/60"></div>
              預金: {{ bankBalance > 0 ? fmt(bankBalance) : '¥0' }}
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-secondary/60"></div>
              投資: {{ stockBalance > 0 ? fmt(stockBalance) : '¥0' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions Section -->
    <section class="space-y-6 px-1">
      <div class="flex justify-between items-end">
        <h2 class="text-premium-headline text-2xl">最近の取引</h2>
        <router-link to="/history" class="text-primary font-bold text-sm hover:underline transition-all">すべて見る</router-link>
      </div>

      <div class="space-y-4">
        <div v-if="txLoading && recentTransactions.length === 0" class="animate-pulse space-y-4">
          <div v-for="i in 3" :key="i" class="h-20 bg-surface-container-low rounded-[1.5rem]"></div>
        </div>
        
        <div v-else-if="recentTransactions.length === 0" class="text-center py-12 card-premium !bg-transparent border-dashed">
          <p class="text-on-surface-variant text-sm font-medium">最近の取引はありません</p>
        </div>

        <!-- Transaction List -->
        <div
          v-for="tx in recentTransactions"
          :key="tx.id"
          class="flex items-center justify-between p-4 bg-surface-container-lowest rounded-[1.5rem] transition-all duration-300 active:scale-[0.98] shadow-sm border border-outline-variant/10 hover:shadow-md"
        >
          <div class="flex items-center gap-4">
            <div :class="['w-12 h-12 flex items-center justify-center rounded-2xl transition-transform duration-500 hover:rotate-12', getCategoryStyle(tx.note || '').color]">
              <span class="material-symbols-outlined text-on-surface/70" style="font-variation-settings: 'FILL' 1;">
                {{ getCategoryStyle(tx.note || '').icon }}
              </span>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-on-surface truncate pr-2">{{ tx.note || '未設定' }}</p>
              <p class="text-premium-label !normal-case !opacity-60">{{ formatDate(tx.transaction_date) }}</p>
            </div>
          </div>
          <p :class="['font-extrabold whitespace-nowrap', tx.kind === 'expense' ? 'text-tertiary' : 'text-secondary']">
            {{ tx.kind === 'expense' ? '-' : '+' }}{{ fmt(tx.amount) }}
          </p>
        </div>
      </div>
    </section>

    <!-- Floating Action Button (Quick Add) -->
    <router-link to="/entry" class="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-br from-primary to-primary-container text-white rounded-[2rem] shadow-[0_12px_32px_rgba(0,64,161,0.25)] flex items-center justify-center z-40 active:scale-90 hover:scale-105 transition-all duration-300">
      <span class="material-symbols-outlined text-3xl">add</span>
    </router-link>
  </div>
</template>

<style scoped>
.hov-underline:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-in {
  animation: fade-in 0.6s ease-out forwards;
}
</style>
