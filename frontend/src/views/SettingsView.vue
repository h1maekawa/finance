<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAssetBreakdown } from '@/composables/useAssetBreakdown'
import { useSavingsGoal } from '@/composables/useSavingsGoal'
import { useHousehold } from '@/composables/useHousehold'
import { useNotificationChannels } from '@/composables/useNotificationChannels'
import { sessionStore } from '@/stores/session'

const { currentHouseholdId } = useHousehold()
const { totalAssets } = useAssetBreakdown(() => currentHouseholdId.value)
const goal = useSavingsGoal(() => currentHouseholdId.value, () => totalAssets.value)

const targetAmountInput = ref(0)
const targetYearInput = ref(2030)
const savedMessage = ref('')
const errorMessage = ref('')
const lineUserIdInput = ref('')
const lineEnabledInput = ref(true)
const savedLineMessage = ref('')
const errorLineMessage = ref('')

const {
  lineChannel,
  fetchLineChannel,
  saveLineChannel,
} = useNotificationChannels()

const accountName = computed(() => {
  if (sessionStore.user?.name?.trim()) return sessionStore.user.name
  if (sessionStore.user?.email) return sessionStore.user.email.split('@')[0]
  return '未設定'
})

const accountEmail = computed(() => sessionStore.user?.email ?? '未設定')
const accountUid = computed(() => sessionStore.user?.id ?? '未設定')

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

async function saveLineSettings() {
  errorLineMessage.value = ''
  savedLineMessage.value = ''

  if (!lineUserIdInput.value.trim()) {
    errorLineMessage.value = 'LINE User IDを入力してください'
    return
  }

  try {
    await saveLineChannel(lineUserIdInput.value, lineEnabledInput.value)
    savedLineMessage.value = 'LINE通知設定を保存しました'
    setTimeout(() => {
      savedLineMessage.value = ''
    }, 1500)
  } catch (error) {
    errorLineMessage.value = error instanceof Error ? error.message : 'LINE通知設定の保存に失敗しました'
  }
}

onMounted(async () => {
  try {
    await fetchLineChannel()
    lineUserIdInput.value = lineChannel.value?.line_user_id ?? ''
    lineEnabledInput.value = lineChannel.value?.is_active ?? true
  } catch {
    // no-op
  }
})
</script>

<template>
  <main class="row" style="flex-direction: column;">
    <section class="card">
      <h2>ログイン中アカウント</h2>
      <p style="margin: 0.2rem 0;">表示名: {{ accountName }}</p>
      <p style="margin: 0.2rem 0;">メール: {{ accountEmail }}</p>
      <p style="margin: 0.2rem 0; word-break: break-all;">UID: {{ accountUid }}</p>
    </section>

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

    <section class="card">
      <h2>LINE通知設定</h2>
      <p style="margin-top: 0; color: #6b7280;">利確タイミングをLINEに通知します（ブラウザ未起動でも通知）。</p>

      <div class="row" style="flex-direction: column;">
        <label style="display: flex; flex-direction: column; gap: 0.4rem;">
          <span style="font-weight: 600;">LINE User ID</span>
          <input v-model="lineUserIdInput" type="text" placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        </label>
        <label style="display: inline-flex; align-items: center; gap: 0.5rem;">
          <input v-model="lineEnabledInput" type="checkbox" />
          <span>LINE通知を有効化</span>
        </label>
        <button style="max-width: 240px;" @click="saveLineSettings">LINE通知設定を保存</button>
        <p v-if="savedLineMessage" style="margin: 0; color: #2563eb;">{{ savedLineMessage }}</p>
        <p v-if="errorLineMessage" style="margin: 0; color: #dc2626;">{{ errorLineMessage }}</p>
      </div>
    </section>
  </main>
</template>
