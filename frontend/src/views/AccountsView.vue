<script setup lang="ts">
import { ref } from 'vue'
import { useAccounts } from '@/composables/useAccounts'
import { useHousehold } from '@/composables/useHousehold'

const { currentHouseholdId } = useHousehold()
const { accounts, totalBalance, loading, updateAccount, deleteAccount } = useAccounts(
  () => currentHouseholdId.value,
)

const editingId = ref<string | null>(null)
const editName = ref('')
const editBalance = ref<number>(0)

function startEdit(account: { id: string; institution_name: string; balance: number }) {
  editingId.value = account.id
  editName.value = account.institution_name
  editBalance.value = account.balance
}

async function saveEdit(id: string) {
  await updateAccount(id, { institution_name: editName.value, balance: editBalance.value })
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

async function handleDelete(id: string) {
  if (!confirm('この口座を削除しますか？')) return
  await deleteAccount(id)
}
</script>

<template>
  <main class="accounts-view">
    <section class="accounts-view__total card">
      <h2 class="accounts-view__total-label">全体口座合計</h2>
      <p class="accounts-view__total-value">{{ totalBalance.toLocaleString() }} 円</p>
    </section>

    <section class="accounts-view__list card">
      <h2 class="accounts-view__section-title">各口座の残高</h2>
      <p v-if="loading" class="accounts-view__loading">読み込み中…</p>
      <p v-else-if="accounts.length === 0" class="accounts-view__empty">まだ口座が登録されていません</p>

      <ul v-else class="accounts-view__items">
        <li v-for="account in accounts" :key="account.id" class="accounts-view__item">
          <template v-if="editingId === account.id">
            <div class="accounts-view__edit-row">
              <input v-model="editName" type="text" class="accounts-view__input accounts-view__input--sm" />
              <input v-model.number="editBalance" type="number" min="0" step="1" class="accounts-view__input accounts-view__input--sm" />
              <div class="accounts-view__edit-actions">
                <button class="accounts-view__btn accounts-view__btn--save" @click="saveEdit(account.id)">保存</button>
                <button class="accounts-view__btn accounts-view__btn--cancel" @click="cancelEdit">取消</button>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="accounts-view__item-info">
              <span class="accounts-view__item-icon">🏦</span>
              <span class="accounts-view__item-name">{{ account.institution_name }}</span>
            </div>
            <div class="accounts-view__item-right">
              <span class="accounts-view__item-balance">{{ account.balance.toLocaleString() }} 円</span>
              <div class="accounts-view__item-actions">
                <button class="accounts-view__btn accounts-view__btn--icon" @click="startEdit(account)">✏️</button>
                <button class="accounts-view__btn accounts-view__btn--icon" @click="handleDelete(account.id)">🗑️</button>
              </div>
            </div>
          </template>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.accounts-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.accounts-view__total {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  text-align: center;
  padding: 1.5rem;
}

.accounts-view__total-label {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.9;
}

.accounts-view__total-value {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
}

.accounts-view__section-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.accounts-view__input {
  width: 100%;
}

.accounts-view__input--sm {
  flex: 1;
  min-width: 0;
}

.accounts-view__btn {
  padding: 0.55rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
}

.accounts-view__btn--save {
  background: #10b981;
  color: #fff;
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;
}

.accounts-view__btn--cancel {
  background: #6b7280;
  color: #fff;
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;
}

.accounts-view__btn--icon {
  background: transparent;
  color: inherit;
  padding: 0.25rem;
  font-size: 1rem;
  line-height: 1;
}

.accounts-view__loading,
.accounts-view__empty {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.accounts-view__items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.accounts-view__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.accounts-view__item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.accounts-view__item-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.accounts-view__item-name {
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.accounts-view__item-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.accounts-view__item-balance {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1e40af;
}

.accounts-view__item-actions {
  display: flex;
  gap: 0.125rem;
}

.accounts-view__edit-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
  align-items: center;
}

.accounts-view__edit-actions {
  display: flex;
  gap: 0.25rem;
}
</style>
