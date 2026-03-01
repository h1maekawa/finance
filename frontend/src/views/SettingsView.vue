<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHousehold } from '@/composables/useHousehold'
import { useCategories } from '@/composables/useCategories'

const { currentHouseholdId } = useHousehold()
const { categories, createCategory, updateCategory, deleteCategory } = useCategories(
  () => currentHouseholdId.value,
)

const incomeCategories = computed(() =>
  categories.value.filter((c) => c.kind === 'income'),
)
const expenseCategories = computed(() =>
  categories.value.filter((c) => c.kind === 'expense'),
)

const incomeForm = ref({
  name: '',
  color: '#10b981',
})
const expenseForm = ref({
  name: '',
  color: '#ef4444',
})

const editingId = ref<string>('')
const editName = ref('')
const editKind = ref<'income' | 'expense'>('expense')
const editColor = ref('#3b82f6')

const savedMessage = ref('')
const errorMessage = ref('')

function flashSaved(message: string) {
  savedMessage.value = message
  setTimeout(() => {
    savedMessage.value = ''
  }, 1500)
}

async function addIncomeCategory() {
  errorMessage.value = ''
  if (!incomeForm.value.name.trim()) {
    errorMessage.value = '収入カテゴリ名を入力してください'
    return
  }

  try {
    await createCategory({
      name: incomeForm.value.name.trim(),
      kind: 'income',
      color: incomeForm.value.color,
    })
    incomeForm.value.name = ''
    flashSaved('収入カテゴリを追加しました')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '追加に失敗しました'
  }
}

async function addExpenseCategory() {
  errorMessage.value = ''
  if (!expenseForm.value.name.trim()) {
    errorMessage.value = '支出カテゴリ名を入力してください'
    return
  }

  try {
    await createCategory({
      name: expenseForm.value.name.trim(),
      kind: 'expense',
      color: expenseForm.value.color,
    })
    expenseForm.value.name = ''
    flashSaved('支出カテゴリを追加しました')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '追加に失敗しました'
  }
}

function startEditCategory(id: string) {
  const target = categories.value.find((c) => c.id === id)
  if (!target) return
  editingId.value = target.id
  editName.value = target.name
  editKind.value = target.kind
  editColor.value = target.color ?? '#3b82f6'
}

function cancelEditCategory() {
  editingId.value = ''
  editName.value = ''
  editKind.value = 'expense'
  editColor.value = '#3b82f6'
}

async function saveEditCategory(id: string) {
  errorMessage.value = ''
  if (!editName.value.trim()) {
    errorMessage.value = 'カテゴリ名を入力してください'
    return
  }

  try {
    await updateCategory(id, {
      name: editName.value.trim(),
      kind: editKind.value,
      color: editColor.value,
    })
    cancelEditCategory()
    flashSaved('カテゴリを更新しました')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '更新に失敗しました'
  }
}

async function removeCategory(id: string) {
  errorMessage.value = ''
  try {
    await deleteCategory(id)
    if (editingId.value === id) {
      cancelEditCategory()
    }
    flashSaved('カテゴリを削除しました')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '削除に失敗しました'
  }
}
</script>

<template>
  <main class="settings-view">
    <section class="card">
      <h1 style="margin-top: 0;">登録カテゴリ</h1>
      <p style="margin-top: 0; color: #6b7280;">収入カテゴリ・支出カテゴリを管理できます。</p>

      <p v-if="savedMessage" class="settings-view__saved">{{ savedMessage }}</p>
      <p v-if="errorMessage" class="settings-view__error">{{ errorMessage }}</p>

      <details class="settings-view__dropdown">
        <summary>収入カテゴリを追加</summary>
        <div class="settings-view__dropdown-body">
          <input v-model="incomeForm.name" type="text" placeholder="例：給与" />
          <input v-model="incomeForm.color" type="color" />
          <button @click="addIncomeCategory">追加</button>
        </div>
      </details>

      <details class="settings-view__dropdown">
        <summary>支出カテゴリを追加</summary>
        <div class="settings-view__dropdown-body">
          <input v-model="expenseForm.name" type="text" placeholder="例：食費" />
          <input v-model="expenseForm.color" type="color" />
          <button @click="addExpenseCategory">追加</button>
        </div>
      </details>
    </section>

    <section class="card">
      <h2 style="margin-top: 0;">収入カテゴリ一覧</h2>
      <ul class="settings-view__list">
        <li v-for="c in incomeCategories" :key="c.id" class="settings-view__item">
          <template v-if="editingId === c.id">
            <div class="settings-view__edit-row">
              <input v-model="editName" type="text" />
              <select v-model="editKind">
                <option value="income">収入</option>
                <option value="expense">支出</option>
              </select>
              <input v-model="editColor" type="color" />
              <button @click="saveEditCategory(c.id)">保存</button>
              <button style="background: #6b7280;" @click="cancelEditCategory">取消</button>
            </div>
          </template>
          <template v-else>
            <div class="settings-view__item-left">
              <span class="settings-view__dot" :style="{ backgroundColor: c.color ?? '#94a3b8' }" />
              <span>{{ c.name }}</span>
            </div>
            <div class="settings-view__item-actions">
              <button @click="startEditCategory(c.id)">編集</button>
              <button style="background: #dc2626;" @click="removeCategory(c.id)">削除</button>
            </div>
          </template>
        </li>
      </ul>
    </section>

    <section class="card">
      <h2 style="margin-top: 0;">支出カテゴリ一覧</h2>
      <ul class="settings-view__list">
        <li v-for="c in expenseCategories" :key="c.id" class="settings-view__item">
          <template v-if="editingId === c.id">
            <div class="settings-view__edit-row">
              <input v-model="editName" type="text" />
              <select v-model="editKind">
                <option value="income">収入</option>
                <option value="expense">支出</option>
              </select>
              <input v-model="editColor" type="color" />
              <button @click="saveEditCategory(c.id)">保存</button>
              <button style="background: #6b7280;" @click="cancelEditCategory">取消</button>
            </div>
          </template>
          <template v-else>
            <div class="settings-view__item-left">
              <span class="settings-view__dot" :style="{ backgroundColor: c.color ?? '#94a3b8' }" />
              <span>{{ c.name }}</span>
            </div>
            <div class="settings-view__item-actions">
              <button @click="startEditCategory(c.id)">編集</button>
              <button style="background: #dc2626;" @click="removeCategory(c.id)">削除</button>
            </div>
          </template>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.settings-view__saved {
  margin: 0.25rem 0 0.5rem;
  color: #2563eb;
}

.settings-view__error {
  margin: 0.25rem 0 0.5rem;
  color: #dc2626;
}

.settings-view__dropdown {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  margin-top: 0.6rem;
  background: #f8fafc;
}

.settings-view__dropdown > summary {
  cursor: pointer;
  font-weight: 700;
}

.settings-view__dropdown-body {
  margin-top: 0.6rem;
  display: grid;
  gap: 0.5rem;
}

.settings-view__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.settings-view__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
}

.settings-view__item-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.settings-view__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.settings-view__item-actions {
  display: flex;
  gap: 0.4rem;
}

.settings-view__edit-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  width: 100%;
}
</style>
