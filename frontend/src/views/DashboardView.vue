<script setup lang="ts">
import { computed, watch } from 'vue'
import { useHousehold } from '@/composables/useHousehold'
import { useTransactions } from '@/composables/useTransactions'
import { useBudgets } from '@/composables/useBudgets'
import { useSavingsGoal } from '@/composables/useSavingsGoal'
import { useAssetBreakdown } from '@/composables/useAssetBreakdown'

const { currentHouseholdId } = useHousehold()
const {
  selectedMonth,
  totalIncome,
  totalExpense,
} = useTransactions(() => currentHouseholdId.value)
const { fetchBudgets } = useBudgets(() => currentHouseholdId.value)
const { totalAssets } = useAssetBreakdown(() => currentHouseholdId.value)
const currentAssetsValue = () => totalAssets.value

const goal = useSavingsGoal(() => currentHouseholdId.value, currentAssetsValue)

const monthInput = computed({
  get: () => selectedMonth.value.toISOString().slice(0, 7),
  set: (value: string) => {
    selectedMonth.value = new Date(`${value}-01T00:00:00`)
  },
})

const monthStart = computed(() => `${monthInput.value}-01`)

const monthlySavingsNeededFromGoal = computed(() => goal.monthlySavingsNeeded.value)

const daysLeftInMonth = computed(() => {
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const left = last.getDate() - now.getDate() + 1
  return Math.max(1, left)
})

const todaySpendable = computed(() => {
  const allowance = totalIncome.value - totalExpense.value - monthlySavingsNeededFromGoal.value
  if (allowance <= 0) return 0
  return Math.floor(allowance / daysLeftInMonth.value)
})

const todaySpendableMessage = computed(() =>
  todaySpendable.value > 0 ? '余裕があります！' : '貯金目標のため今日は節制を',
)

const dreamMessage = computed(() =>
  `🏡 古民家カフェ×バーの夢まで、あと${goal.monthsRemaining.value}ヶ月！毎月コツコツ貯めて目標を達成しましょう💪`,
)

watch(
  monthStart,
  (start) => {
    void fetchBudgets(start)
  },
  { immediate: true },
)
</script>

<template>
  <main class="dashboard">
    <section class="dashboard__section">
      <h2 class="dashboard__heading">目標達成率</h2>
      <p class="dashboard__rate">{{ goal.achievementRate.value.toFixed(1) }}%</p>
      <div class="progress-bar">
        <div
          class="progress-bar__fill"
          :style="{ width: `${Math.min(100, goal.achievementRate.value)}%` }"
        />
      </div>
      <p class="dashboard__progress-caption">
        {{ totalAssets.toLocaleString() }}円 / {{ goal.targetAmount.value.toLocaleString() }}円
      </p>
    </section>

    <section class="dashboard__section dashboard__section--highlight">
      <h2 class="dashboard__heading">今日使っていい金額</h2>
      <p class="dashboard__today-amount">{{ todaySpendable.toLocaleString() }}円</p>
      <p class="dashboard__today-message">{{ todaySpendableMessage }}</p>
    </section>

    <section class="dashboard__grid">
      <article class="dashboard__card">
        <h3 class="dashboard__card-label">現在資産</h3>
        <p class="dashboard__card-value">{{ totalAssets.toLocaleString() }}円</p>
      </article>
      <article class="dashboard__card">
        <h3 class="dashboard__card-label">目標金額</h3>
        <p class="dashboard__card-value">{{ goal.targetAmount.value.toLocaleString() }}円</p>
      </article>
      <article class="dashboard__card">
        <h3 class="dashboard__card-label">残り必要額</h3>
        <p class="dashboard__card-value">{{ goal.remainingNeeded.value.toLocaleString() }}円</p>
      </article>
      <article class="dashboard__card">
        <h3 class="dashboard__card-label">開業予定年</h3>
        <p class="dashboard__card-value">{{ goal.targetYear.value }}年</p>
      </article>
    </section>

    <section class="dashboard__section dashboard__section--monthly">
      <h2 class="dashboard__heading">月次計画</h2>
      <div class="dashboard__monthly-row">
        <span>残り月数{{ goal.monthsRemaining.value }}ヶ月</span>
        <span>今月必要な貯金額{{ monthlySavingsNeededFromGoal.toLocaleString() }}円</span>
      </div>
      <p class="dashboard__dream-message">{{ dreamMessage }}</p>
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

.dashboard__section--monthly {
  background: #f0fdfa;
  border: 1px solid #99f6e4;
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

.dashboard__rate {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.dashboard__progress-caption {
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.progress-bar {
  height: 12px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #0d9488, #14b8a6);
  border-radius: 999px;
  transition: width 0.3s ease;
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

.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.dashboard__card {
  background: var(--card-bg);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
}

.dashboard__card-label {
  margin: 0 0 0.25rem 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.dashboard__card-value {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.dashboard__monthly-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
}

.dashboard__dream-message {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
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
