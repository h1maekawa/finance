<script setup lang="ts">
import { computed } from 'vue'
import { useHousehold } from '@/composables/useHousehold'
import { useSavingsGoal } from '@/composables/useSavingsGoal'
import { useAccounts } from '@/composables/useAccounts'
import { useInvestments } from '@/composables/useInvestments'

const { currentHouseholdId } = useHousehold()
const { totalBalance } = useAccounts(() => currentHouseholdId.value)
const { totalInvestments } = useInvestments(() => currentHouseholdId.value)

const grandTotal = computed(() => totalBalance.value + totalInvestments.value)

const goal = useSavingsGoal(
  () => currentHouseholdId.value,
  () => grandTotal.value,
)

const monthlySavingsNeeded = computed(() => goal.monthlySavingsNeeded.value)

const dreamMessage = computed(
  () => `🏡 古民家カフェ×バーの夢まで、あと${goal.monthsRemaining.value}ヶ月！毎月コツコツ貯めて目標を達成しましょう💪`,
)
</script>

<template>
  <main class="goal-view">
    <section class="card">
      <h2 class="goal-view__label">現在資産</h2>
      <p class="goal-view__value">{{ grandTotal.toLocaleString() }}円</p>

      <h2 class="goal-view__label">目標金額</h2>
      <p class="goal-view__value">{{ goal.targetAmount.value.toLocaleString() }}円</p>

      <h2 class="goal-view__label">残り必要額</h2>
      <p class="goal-view__value">{{ goal.remainingNeeded.value.toLocaleString() }}円</p>

      <h2 class="goal-view__label">開業予定年</h2>
      <p class="goal-view__value">{{ goal.targetYear.value }}年</p>

      <h2 class="goal-view__label">月次計画</h2>
      <p class="goal-view__line">残り月数{{ goal.monthsRemaining.value }}ヶ月</p>
      <p class="goal-view__line">今月必要な貯金額{{ monthlySavingsNeeded.toLocaleString() }}円</p>
      <p class="goal-view__message">{{ dreamMessage }}</p>
    </section>
  </main>
</template>

<style scoped>
.goal-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.goal-view__label {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
}

.goal-view__value {
  margin: 0 0 1rem;
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
}

.goal-view__line {
  margin: 0.25rem 0;
  font-size: 1rem;
  color: #0f172a;
}

.goal-view__message {
  margin: 0.4rem 0 0;
  color: #334155;
}
</style>
