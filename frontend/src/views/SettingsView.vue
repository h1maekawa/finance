<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAssetBreakdown } from '@/composables/useAssetBreakdown'
import { useSavingsGoal } from '@/composables/useSavingsGoal'
import { useHousehold } from '@/composables/useHousehold'

const { currentHouseholdId } = useHousehold()
const { totalAssets } = useAssetBreakdown(() => currentHouseholdId.value)
const goal = useSavingsGoal(() => currentHouseholdId.value, () => totalAssets.value)

const targetAmountInput = ref(0)
const targetYearInput = ref(2030)
const savedMessage = ref('')
const errorMessage = ref('')

watch(
  [goal.targetAmount, goal.targetYear],
  () => {
    targetAmountInput.value = goal.targetAmount.value
    targetYearInput.value = goal.targetYear.value
  },
  { immediate: true },
)

async function saveGoal() {
  errorMessage.value = ''
  savedMessage.value = ''

  try {
    await goal.setTarget(Number(targetAmountInput.value) || 0)
    await goal.setTargetYear(Number(targetYearInput.value) || new Date().getFullYear())
    savedMessage.value = '保存しました'
    setTimeout(() => {
      savedMessage.value = ''
    }, 1500)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '保存に失敗しました'
  }
}
</script>

<template>
  <main class="row" style="flex-direction: column;">
    <section class="card">
      <h1>設定</h1>
      <p style="margin-top: 0; color: #6b7280;">目標金額をここで変更できます。</p>

      <div class="row" style="flex-direction: column;">
        <label style="display: flex; flex-direction: column; gap: 0.4rem;">
          <span style="font-weight: 600;">目標金額</span>
          <input v-model.number="targetAmountInput" type="number" min="0" step="10000" />
        </label>

        <label style="display: flex; flex-direction: column; gap: 0.4rem;">
          <span style="font-weight: 600;">目標年</span>
          <input v-model.number="targetYearInput" type="number" min="2025" max="2100" step="1" />
        </label>

        <button style="max-width: 200px;" @click="saveGoal">保存</button>
        <p v-if="savedMessage" style="margin: 0; color: #2563eb;">{{ savedMessage }}</p>
        <p v-if="errorMessage" style="margin: 0; color: #dc2626;">{{ errorMessage }}</p>
      </div>
    </section>

    <section class="card">
      <h2>現在の目標</h2>
      <p style="margin: 0.2rem 0;">目標金額: {{ goal.targetAmount.value.toLocaleString() }} 円</p>
      <p style="margin: 0.2rem 0;">目標年: {{ goal.targetYear.value }} 年</p>
      <p style="margin: 0.2rem 0;">残り必要額: {{ goal.remainingNeeded.value.toLocaleString() }} 円</p>
    </section>
  </main>
</template>
