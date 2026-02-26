<script setup lang="ts">
import { ref } from 'vue'
import { useAccounts } from '@/composables/useAccounts'
import { useHousehold } from '@/composables/useHousehold'

const { currentHouseholdId } = useHousehold()
const { accounts, addAccount } = useAccounts(() => currentHouseholdId.value)

const showAddModal = ref(false)
const newName = ref('')
const newBalance = ref<number | undefined>(undefined)
const errorMessage = ref('')

async function handleAdd() {
  errorMessage.value = ''
  if (!newName.value.trim()) {
    errorMessage.value = '金融機関名を入力してください。'
    return
  }

  try {
    await addAccount(newName.value, newBalance.value ?? 0)
    newName.value = ''
    newBalance.value = undefined
    showAddModal.value = false
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登録に失敗しました。'
  }
}
</script>

<template>
  <main class="register-view">
    <section class="card register-view__hero">
      <h2 class="register-view__title">登録</h2>
      <p class="register-view__desc">口座の新規登録はこちらから行います。</p>
      <button type="button" class="register-view__btn" @click="showAddModal = true">口座を登録</button>
      <p v-if="errorMessage" class="register-view__error">{{ errorMessage }}</p>
    </section>

    <section class="card">
      <h3 class="register-view__sub-title">登録済み口座</h3>
      <p v-if="accounts.length === 0" class="register-view__empty">まだ口座が登録されていません</p>
      <ul v-else class="register-view__list">
        <li v-for="account in accounts" :key="account.id" class="register-view__item">
          <span>{{ account.institution_name }}</span>
          <span>{{ account.balance.toLocaleString() }} 円</span>
        </li>
      </ul>
    </section>

    <div v-if="showAddModal" class="register-view__modal-overlay" @click.self="showAddModal = false">
      <section class="register-view__modal card">
        <h3 class="register-view__sub-title">口座を追加</h3>
        <form class="register-view__form" @submit.prevent="handleAdd">
          <input
            v-model="newName"
            type="text"
            placeholder="金融機関名（例：三菱UFJ銀行）"
            required
          />
          <input
            v-model.number="newBalance"
            type="number"
            min="0"
            step="1"
            placeholder="残高（円）"
          />
          <div class="register-view__actions">
            <button type="submit">登録する</button>
            <button type="button" class="register-view__close" @click="showAddModal = false">閉じる</button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.register-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.register-view__hero {
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
  color: #fff;
}

.register-view__title {
  margin: 0;
  font-size: 1.1rem;
}

.register-view__desc {
  margin: 0.4rem 0 0.8rem;
  font-size: 0.92rem;
  opacity: 0.95;
}

.register-view__btn {
  background: #ffffff;
  color: #0f766e;
  font-weight: 700;
}

.register-view__error {
  margin: 0.5rem 0 0;
  color: #fecaca;
}

.register-view__sub-title {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
}

.register-view__empty {
  margin: 0;
  color: #6b7280;
}

.register-view__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.register-view__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  font-weight: 600;
}

.register-view__modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.register-view__modal {
  width: min(520px, 100%);
}

.register-view__form {
  display: grid;
  gap: 0.5rem;
}

.register-view__actions {
  display: flex;
  gap: 0.5rem;
}

.register-view__close {
  background: #6b7280;
}
</style>
