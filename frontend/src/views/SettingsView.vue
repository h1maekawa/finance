<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHousehold } from '@/composables/useHousehold'
import { useCategories } from '@/composables/useCategories'
import { useAssetBreakdown } from '@/composables/useAssetBreakdown'
import { useSavingsGoal } from '@/composables/useSavingsGoal'
import { useInvitation } from '@/composables/useInvitation'

const { currentHouseholdId } = useHousehold()
const { categories, createCategory, updateCategory, deleteCategory } = useCategories(
  () => currentHouseholdId.value,
)
const { totalAssets } = useAssetBreakdown(() => currentHouseholdId.value)
const goal = useSavingsGoal(() => currentHouseholdId.value, () => totalAssets.value)
const { invitations, members, fetchMembers, fetchInvitations, createInvitation, revokeInvitation } = useInvitation(() => currentHouseholdId.value)

const inviteEmail = ref('')
const generatedToken = ref('')
const copySuccess = ref(false)

watch(() => currentHouseholdId.value, (id) => {
  if (id) {
    fetchMembers()
    fetchInvitations()
  }
}, { immediate: true })

async function handleInvite() {
  if (!inviteEmail.value) return
  try {
    const token = await createInvitation(inviteEmail.value)
    generatedToken.value = `${window.location.origin}/signup?invite=${token}`
    inviteEmail.value = ''
  } catch (e) {
    errorMessage.value = '招待の作成に失敗しました'
  }
}

function copyInviteLink() {
  navigator.clipboard.writeText(generatedToken.value)
  copySuccess.value = true
  setTimeout(() => copySuccess.value = false, 2000)
}

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
const goalSavedMessage = ref('')
const goalErrorMessage = ref('')
const targetAmountInput = ref(0)
const targetYearInput = ref(new Date().getFullYear() + 3)

function flashSaved(message: string) {
  savedMessage.value = message
  setTimeout(() => {
    savedMessage.value = ''
  }, 1500)
}

function syncGoalInputs() {
  targetAmountInput.value = goal.targetAmount.value
  targetYearInput.value = goal.targetYear.value
}
syncGoalInputs()
watch([goal.targetAmount, goal.targetYear], () => {
  syncGoalInputs()
})

async function saveGoalSettings() {
  goalErrorMessage.value = ''
  goalSavedMessage.value = ''

  try {
    await goal.setTarget(Number(targetAmountInput.value) || 0)
    await goal.setTargetYear(Number(targetYearInput.value) || new Date().getFullYear())
    goalSavedMessage.value = '目標設定を保存しました'
    setTimeout(() => {
      goalSavedMessage.value = ''
    }, 1500)
  } catch (error) {
    goalErrorMessage.value = error instanceof Error ? error.message : '目標設定の保存に失敗しました'
  }
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
      <h1 style="margin-top: 0;">目標設定</h1>
      <p style="margin-top: 0; color: #6b7280;">目標金額と目標期日（年）を設定します。</p>

      <div class="row" style="align-items: end;">
        <label style="display: flex; flex-direction: column; gap: 0.35rem; min-width: 180px;">
          <span style="font-weight: 600;">目標金額</span>
          <input v-model.number="targetAmountInput" type="number" min="0" step="10000" />
        </label>
        <label style="display: flex; flex-direction: column; gap: 0.35rem; min-width: 140px;">
          <span style="font-weight: 600;">目標期日（年）</span>
          <input v-model.number="targetYearInput" type="number" min="2025" max="2100" step="1" />
        </label>
        <button style="max-width: 180px;" @click="saveGoalSettings">目標を保存</button>
      </div>
      <p v-if="goalSavedMessage" class="settings-view__saved">{{ goalSavedMessage }}</p>
      <p v-if="goalErrorMessage" class="settings-view__error">{{ goalErrorMessage }}</p>
    </section>

    <section class="card">
      <h1 style="margin-top: 0;">家族共有・招待</h1>
      <p style="margin-top: 0; color: #6b7280;">同じ家計簿を共有するメンバーを管理します。</p>

      <div class="settings-members">
        <h2 class="settings-sub-heading">現在のメンバー</h2>
        <ul class="settings-member-list">
          <li v-for="m in members" :key="m.user_id" class="settings-member-item">
            <div class="settings-member-info">
              <span class="settings-role-badge" :class="`settings-role-badge--${m.role}`">{{ m.role }}</span>
              <span class="settings-member-name">{{ m.profiles?.display_name || '名称未設定' }}</span>
            </div>
          </li>
        </ul>
      </div>

      <div v-if="invitations.length > 0" class="settings-invitations">
        <h2 class="settings-sub-heading">待機中の招待</h2>
        <ul class="settings-member-list">
          <li v-for="inv in invitations" :key="inv.id" class="settings-member-item">
            <span class="settings-member-email">{{ inv.email }}</span>
            <button class="settings-btn-revoke" @click="revokeInvitation(inv.id)">取消</button>
          </li>
        </ul>
      </div>

      <div class="settings-invite-form">
        <h2 class="settings-sub-heading">新しく招待する</h2>
        <div class="row">
          <input v-model="inviteEmail" type="email" placeholder="招待する方のメールアドレス" style="flex: 1;" />
          <button @click="handleInvite" :disabled="!inviteEmail">招待リンクを発行</button>
        </div>
        <div v-if="generatedToken" class="settings-invite-link">
          <p class="settings-invite-link__label">以下のリンクを共有してください：</p>
          <div class="settings-invite-link__box">
            <code class="settings-invite-link__code">{{ generatedToken }}</code>
            <button class="settings-invite-link__copy" @click="copyInviteLink">
              {{ copySuccess ? 'コピーしました！' : 'コピー' }}
            </button>
          </div>
        </div>
      </div>
    </section>

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

.settings-sub-heading {
  font-size: 1rem;
  margin-bottom: 0.75rem;
  font-weight: 700;
  color: #374151;
}

.settings-member-list {
  list-style: none;
  padding: 0;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.settings-member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.settings-member-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.settings-role-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  text-transform: uppercase;
  font-weight: 700;
}

.settings-role-badge--owner { background: #fef3c7; color: #92400e; }
.settings-role-badge--admin { background: #dcfce7; color: #166534; }
.settings-role-badge--member { background: #f1f5f9; color: #475569; }

.settings-btn-revoke {
  background: #fee2e2;
  color: #ef4444;
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
}

.settings-invite-form {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
  margin-top: 1rem;
}

.settings-invite-link {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0fdfa;
  border-radius: 12px;
  border: 1px solid #5eead4;
}

.settings-invite-link__label {
  font-size: 0.85rem;
  color: #0f766e;
  margin-bottom: 0.5rem;
}

.settings-invite-link__box {
  display: flex;
  gap: 0.5rem;
}

.settings-invite-link__code {
  flex: 1;
  background: #fff;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 0.85rem;
  word-break: break-all;
}

.settings-invite-link__copy {
  white-space: nowrap;
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
}
</style>
