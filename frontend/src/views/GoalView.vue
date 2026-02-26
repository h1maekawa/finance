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
  <main class="row" style="flex-direction: column;">
    <section class="card">
      <h1 style="margin: 0;">目標</h1>
    </section>

    <section class="row">
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>現在資産</h3>
        <p>{{ grandTotal.toLocaleString() }}円</p>
      </article>
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>目標金額</h3>
        <p>{{ goal.targetAmount.value.toLocaleString() }}円</p>
      </article>
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>残り必要額</h3>
        <p>{{ goal.remainingNeeded.value.toLocaleString() }}円</p>
      </article>
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>開業予定年</h3>
        <p>{{ goal.targetYear.value }}年</p>
      </article>
    </section>

    <section class="card">
      <h2>月次計画</h2>
      <p>残り月数{{ goal.monthsRemaining.value }}ヶ月</p>
      <p>今月必要な貯金額{{ monthlySavingsNeeded.toLocaleString() }}円</p>
      <p style="margin-bottom: 0; color: #334155;">{{ dreamMessage }}</p>
    </section>
  </main>
</template>
