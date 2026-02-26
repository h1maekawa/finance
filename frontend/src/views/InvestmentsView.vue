<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useInvestments, ASSET_TYPES } from '@/composables/useInvestments'
import { useHousehold } from '@/composables/useHousehold'
import type { InvestmentAsset } from '@/types/db'

const { currentHouseholdId } = useHousehold()
const {
  investments,
  totalInvestments,
  loading,
  quoteLoading,
  quoteErrors,
  quotesByTicker,
  getCurrentAmount,
  getTakeProfitHit,
  refreshQuotes,
  requestNotificationPermission,
  addInvestment,
  updateInvestment,
  deleteInvestment,
} = useInvestments(() => currentHouseholdId.value)

const formError = ref('')
const flashMessage = ref('')

const newType = ref<string>(ASSET_TYPES[0])
const newName = ref('')
const newTicker = ref('')
const newAmount = ref<number | undefined>(undefined)
const newQuantity = ref<number | undefined>(undefined)
const newAvgCost = ref<number | undefined>(undefined)
const newTakeProfitPrice = ref<number | undefined>(undefined)
const newNotifyTakeProfit = ref(false)

const editingId = ref<string | null>(null)
const editType = ref('')
const editName = ref('')
const editTicker = ref('')
const editAmount = ref<number>(0)
const editQuantity = ref<number>(0)
const editAvgCost = ref<number | undefined>(undefined)
const editTakeProfitPrice = ref<number | undefined>(undefined)
const editNotifyTakeProfit = ref(false)

let refreshTimer: number | null = null

function typeIcon(type: string): string {
  switch (type) {
    case '投資信託': return '📈'
    case '個別株': return '📊'
    case 'ETF': return '🔄'
    default: return '💰'
  }
}

function quoteFor(asset: InvestmentAsset) {
  if (!asset.ticker) return null
  return quotesByTicker.value[asset.ticker.toUpperCase()] ?? null
}

function formattedProfit(asset: InvestmentAsset): string | null {
  const quote = quoteFor(asset)
  if (!quote || asset.quantity <= 0 || !asset.avg_cost || asset.avg_cost <= 0) {
    return null
  }
  const profit = (quote.price - asset.avg_cost) * asset.quantity
  const sign = profit >= 0 ? '+' : ''
  return `${sign}${Math.round(profit).toLocaleString()} 円`
}

function formattedLiveAmount(asset: InvestmentAsset): string {
  return `${getCurrentAmount(asset).toLocaleString()} 円`
}

async function handleAdd() {
  formError.value = ''
  flashMessage.value = ''
  if (!newName.value.trim()) {
    formError.value = '銘柄名を入力してください。'
    return
  }

  try {
    await addInvestment(newType.value, newName.value, newAmount.value ?? 0, {
      ticker: newTicker.value,
      quantity: newQuantity.value ?? 0,
      avgCost: newAvgCost.value,
      takeProfitPrice: newTakeProfitPrice.value,
      notifyTakeProfit: newNotifyTakeProfit.value,
    })
    newType.value = ASSET_TYPES[0]
    newName.value = ''
    newTicker.value = ''
    newAmount.value = undefined
    newQuantity.value = undefined
    newAvgCost.value = undefined
    newTakeProfitPrice.value = undefined
    newNotifyTakeProfit.value = false
    await refreshQuotes()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '資産の追加に失敗しました。'
  }
}

function startEdit(asset: InvestmentAsset) {
  editingId.value = asset.id
  editType.value = asset.asset_type
  editName.value = asset.name
  editTicker.value = asset.ticker ?? ''
  editAmount.value = asset.amount
  editQuantity.value = asset.quantity
  editAvgCost.value = asset.avg_cost ?? undefined
  editTakeProfitPrice.value = asset.take_profit_price ?? undefined
  editNotifyTakeProfit.value = asset.notify_take_profit
}

async function saveEdit(id: string) {
  try {
    await updateInvestment(id, {
      asset_type: editType.value,
      name: editName.value,
      ticker: editTicker.value,
      amount: editAmount.value,
      quantity: editQuantity.value,
      avg_cost: editAvgCost.value ?? null,
      take_profit_price: editTakeProfitPrice.value ?? null,
      notify_take_profit: editNotifyTakeProfit.value,
    })
    editingId.value = null
    await refreshQuotes()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '更新に失敗しました。'
  }
}

function cancelEdit() {
  editingId.value = null
}

async function handleDelete(id: string) {
  if (!confirm('この資産を削除しますか？')) return
  try {
    await deleteInvestment(id)
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '削除に失敗しました。'
  }
}

async function enableNotifications() {
  const status = await requestNotificationPermission()
  flashMessage.value = status === 'granted'
    ? '通知を有効化しました。利確到達時に通知します。'
    : '通知が許可されていません。ブラウザ設定で許可してください。'
}

async function manualRefreshQuotes() {
  await refreshQuotes()
}

onMounted(() => {
  void refreshQuotes()
  refreshTimer = window.setInterval(() => {
    void refreshQuotes()
  }, 60000)
})

onBeforeUnmount(() => {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer)
  }
})
</script>

<template>
  <main class="investments-view">
    <section class="investments-view__total card">
      <h2 class="investments-view__total-label">資産合計（リアルタイム）</h2>
      <p class="investments-view__total-value">{{ totalInvestments.toLocaleString() }} 円</p>
      <div class="investments-view__toolbar">
        <button type="button" class="investments-view__btn investments-view__btn--ghost" @click="manualRefreshQuotes">
          {{ quoteLoading ? '更新中...' : '株価更新' }}
        </button>
        <button type="button" class="investments-view__btn investments-view__btn--ghost" @click="enableNotifications">
          利確通知を有効化
        </button>
      </div>
      <p v-if="flashMessage" class="investments-view__flash">{{ flashMessage }}</p>
      <ul v-if="quoteErrors.length > 0" class="investments-view__errors">
        <li v-for="err in quoteErrors" :key="err">{{ err }}</li>
      </ul>
    </section>

    <section class="investments-view__add card">
      <h2 class="investments-view__section-title">資産を追加</h2>
      <form class="investments-view__form" @submit.prevent="handleAdd">
        <select v-model="newType" class="investments-view__select">
          <option v-for="type in ASSET_TYPES" :key="type" :value="type">{{ type }}</option>
        </select>
        <input
          v-model="newName"
          type="text"
          placeholder="銘柄名（例：Apple / eMAXIS Slim 全世界株式）"
          class="investments-view__input"
          required
        />
        <input
          v-model="newTicker"
          type="text"
          placeholder="ティッカー（例：AAPL, 7203.T）"
          class="investments-view__input"
        />
        <input
          v-model.number="newQuantity"
          type="number"
          min="0"
          step="0.000001"
          placeholder="保有数量"
          class="investments-view__input"
        />
        <input
          v-model.number="newAvgCost"
          type="number"
          min="0"
          step="0.000001"
          placeholder="平均取得単価"
          class="investments-view__input"
        />
        <input
          v-model.number="newAmount"
          type="number"
          min="0"
          step="1"
          placeholder="手動評価額（ティッカー未使用時）"
          class="investments-view__input"
        />
        <div v-if="newType === '個別株'" class="investments-view__inline-row">
          <input
            v-model.number="newTakeProfitPrice"
            type="number"
            min="0"
            step="0.000001"
            placeholder="利確価格（通知ライン）"
            class="investments-view__input"
          />
          <label class="investments-view__checkbox-label">
            <input v-model="newNotifyTakeProfit" type="checkbox" />
            利確通知を有効化
          </label>
        </div>
        <button type="submit" class="investments-view__btn investments-view__btn--add">追加</button>
        <p v-if="formError" class="investments-view__error">{{ formError }}</p>
      </form>
    </section>

    <section class="investments-view__list card">
      <h2 class="investments-view__section-title">登録資産一覧</h2>
      <p v-if="loading" class="investments-view__loading">読み込み中…</p>
      <p v-else-if="investments.length === 0" class="investments-view__empty">まだ資産が登録されていません</p>

      <ul v-else class="investments-view__items">
        <li v-for="asset in investments" :key="asset.id" class="investments-view__item">
          <template v-if="editingId === asset.id">
            <div class="investments-view__edit-row">
              <select v-model="editType" class="investments-view__select investments-view__select--sm">
                <option v-for="type in ASSET_TYPES" :key="type" :value="type">{{ type }}</option>
              </select>
              <input v-model="editName" type="text" class="investments-view__input investments-view__input--sm" />
              <input v-model="editTicker" type="text" placeholder="ticker" class="investments-view__input investments-view__input--sm" />
              <input v-model.number="editQuantity" type="number" min="0" step="0.000001" placeholder="数量" class="investments-view__input investments-view__input--sm" />
              <input v-model.number="editAvgCost" type="number" min="0" step="0.000001" placeholder="取得単価" class="investments-view__input investments-view__input--sm" />
              <input v-model.number="editAmount" type="number" min="0" step="1" placeholder="手動評価額" class="investments-view__input investments-view__input--sm" />
              <input v-if="editType === '個別株'" v-model.number="editTakeProfitPrice" type="number" min="0" step="0.000001" placeholder="利確価格" class="investments-view__input investments-view__input--sm" />
              <label v-if="editType === '個別株'" class="investments-view__checkbox-label">
                <input v-model="editNotifyTakeProfit" type="checkbox" />
                通知
              </label>
              <div class="investments-view__edit-actions">
                <button class="investments-view__btn investments-view__btn--save" @click="saveEdit(asset.id)">保存</button>
                <button class="investments-view__btn investments-view__btn--cancel" @click="cancelEdit">取消</button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="investments-view__item-info">
              <span class="investments-view__item-icon">{{ typeIcon(asset.asset_type) }}</span>
              <div class="investments-view__item-text">
                <span class="investments-view__item-type">{{ asset.asset_type }}</span>
                <span class="investments-view__item-name">{{ asset.name }}</span>
                <span v-if="asset.ticker" class="investments-view__ticker">{{ asset.ticker }}</span>
              </div>
            </div>
            <div class="investments-view__item-right">
              <span class="investments-view__item-amount">{{ formattedLiveAmount(asset) }}</span>
              <span v-if="quoteFor(asset)" class="investments-view__quote">現在値: {{ quoteFor(asset)?.price.toLocaleString() }}</span>
              <span v-if="formattedProfit(asset)" class="investments-view__profit">損益: {{ formattedProfit(asset) }}</span>
              <span v-if="getTakeProfitHit(asset)" class="investments-view__take-profit">利確候補</span>
              <div class="investments-view__item-actions">
                <button class="investments-view__btn investments-view__btn--icon" @click="startEdit(asset)">✏️</button>
                <button class="investments-view__btn investments-view__btn--icon" @click="handleDelete(asset.id)">🗑️</button>
              </div>
            </div>
          </template>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.investments-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.investments-view__total {
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
  color: #fff;
  text-align: center;
  padding: 1.5rem;
}

.investments-view__total-label {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.9;
}

.investments-view__total-value {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
}

.investments-view__toolbar {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.investments-view__flash {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
}

.investments-view__errors {
  margin: 0.5rem 0 0;
  padding-left: 1rem;
  font-size: 0.8rem;
  text-align: left;
}

.investments-view__section-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.investments-view__form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.investments-view__inline-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.investments-view__checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
}

.investments-view__input,
.investments-view__select {
  width: 100%;
}

.investments-view__input--sm,
.investments-view__select--sm {
  flex: 1;
  min-width: 0;
}

.investments-view__btn {
  padding: 0.55rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
}

.investments-view__btn--add {
  background: #0f766e;
  color: #fff;
}

.investments-view__btn--ghost {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.investments-view__btn--save {
  background: #10b981;
  color: #fff;
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;
}

.investments-view__btn--cancel {
  background: #6b7280;
  color: #fff;
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;
}

.investments-view__btn--icon {
  background: transparent;
  color: inherit;
  padding: 0.25rem;
  font-size: 1rem;
  line-height: 1;
}

.investments-view__loading,
.investments-view__empty,
.investments-view__error {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.investments-view__error {
  color: #dc2626;
}

.investments-view__items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.investments-view__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.investments-view__item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.investments-view__item-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.investments-view__item-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.investments-view__item-type {
  font-size: 0.7rem;
  font-weight: 600;
  color: #0f766e;
  text-transform: uppercase;
}

.investments-view__item-name {
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.investments-view__ticker {
  font-size: 0.75rem;
  color: #6b7280;
}

.investments-view__item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  flex-shrink: 0;
}

.investments-view__item-amount {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0f766e;
}

.investments-view__quote,
.investments-view__profit {
  font-size: 0.75rem;
  color: #4b5563;
}

.investments-view__take-profit {
  background: #fef3c7;
  color: #92400e;
  border-radius: 999px;
  padding: 0.15rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
}

.investments-view__item-actions {
  display: flex;
  gap: 0.125rem;
}

.investments-view__edit-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
  align-items: center;
}

.investments-view__edit-actions {
  display: flex;
  gap: 0.25rem;
}
</style>
