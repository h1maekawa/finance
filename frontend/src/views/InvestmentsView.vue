<script setup lang="ts">
import { ref } from 'vue'
import { useInvestments, ASSET_TYPES } from '@/composables/useInvestments'
import { useHousehold } from '@/composables/useHousehold'

const { currentHouseholdId } = useHousehold()
const { investments, totalInvestments, loading, addInvestment, updateInvestment, deleteInvestment } = useInvestments(
  () => currentHouseholdId.value,
)

const newType = ref<string>(ASSET_TYPES[0])
const newName = ref('')
const newAmount = ref<number | undefined>(undefined)

const editingId = ref<string | null>(null)
const editType = ref('')
const editName = ref('')
const editAmount = ref<number>(0)

async function handleAdd() {
  if (!newName.value.trim()) return
  await addInvestment(newType.value, newName.value, newAmount.value ?? 0)
  newType.value = ASSET_TYPES[0]
  newName.value = ''
  newAmount.value = undefined
}

function startEdit(asset: { id: string; asset_type: string; name: string; amount: number }) {
  editingId.value = asset.id
  editType.value = asset.asset_type
  editName.value = asset.name
  editAmount.value = asset.amount
}

async function saveEdit(id: string) {
  await updateInvestment(id, { asset_type: editType.value, name: editName.value, amount: editAmount.value })
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

async function handleDelete(id: string) {
  if (!confirm('この資産を削除しますか？')) return
  await deleteInvestment(id)
}

function typeIcon(type: string): string {
  switch (type) {
    case '投資信託': return '📈'
    case '個別株': return '📊'
    case 'ETF': return '🔄'
    default: return '💰'
  }
}
</script>

<template>
  <main class="investments-view">
    <!-- 合計評価額 -->
    <section class="investments-view__total card">
      <h2 class="investments-view__total-label">資産合計</h2>
      <p class="investments-view__total-value">{{ totalInvestments.toLocaleString() }} 円</p>
    </section>

    <!-- 新規追加 -->
    <section class="investments-view__add card">
      <h2 class="investments-view__section-title">資産を追加</h2>
      <form class="investments-view__form" @submit.prevent="handleAdd">
        <select v-model="newType" class="investments-view__select">
          <option v-for="type in ASSET_TYPES" :key="type" :value="type">{{ type }}</option>
        </select>
        <input
          v-model="newName"
          type="text"
          placeholder="銘柄名（例：eMAXIS Slim 全世界株式）"
          class="investments-view__input"
          required
        />
        <input
          v-model.number="newAmount"
          type="number"
          min="0"
          step="1"
          placeholder="評価額（円）"
          class="investments-view__input"
        />
        <button type="submit" class="investments-view__btn investments-view__btn--add">追加</button>
      </form>
    </section>

    <!-- 資産一覧 -->
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
              <input v-model.number="editAmount" type="number" min="0" step="1" class="investments-view__input investments-view__input--sm" />
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
              </div>
            </div>
            <div class="investments-view__item-right">
              <span class="investments-view__item-amount">{{ asset.amount.toLocaleString() }} 円</span>
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
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
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
  background: #7c3aed;
  color: #fff;
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
.investments-view__empty {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
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
  color: #7c3aed;
  text-transform: uppercase;
}

.investments-view__item-name {
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.investments-view__item-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.investments-view__item-amount {
  font-weight: 700;
  font-size: 0.95rem;
  color: #6d28d9;
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
