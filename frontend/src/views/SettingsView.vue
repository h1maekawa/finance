<template>
  <div class="page-content">
    <div class="settings-header">
      <h1 class="page-title">設定</h1>
    </div>

    <!-- User info -->
    <div class="settings-section">
      <h2 class="section-title">アカウント</h2>
      <div class="user-card">
        <div class="user-avatar">
          <span class="material-symbols-rounded">person</span>
        </div>
        <div class="user-info">
          <p class="user-name">{{ user?.displayName ?? 'ユーザー' }}</p>
          <p class="user-email">{{ user?.email }}</p>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <span class="material-symbols-rounded">logout</span>
          ログアウト
        </button>
      </div>
    </div>

    <!-- Category management -->
    <div class="settings-section">
      <h2 class="section-title">カテゴリ管理</h2>

      <!-- Kind toggle -->
      <div class="toggle-group" style="margin-bottom:16px">
        <button
          class="toggle-btn"
          :class="{ 'active-expense': activeKind === 'expense' }"
          @click="activeKind = 'expense'"
        >支出カテゴリ</button>
        <button
          class="toggle-btn"
          :class="{ 'active-income': activeKind === 'income' }"
          @click="activeKind = 'income'"
        >収入カテゴリ</button>
      </div>

      <div v-if="loading" class="loading">読み込み中...</div>

      <div v-else>
        <div class="cat-list">
          <div v-for="cat in filteredCategories" :key="cat.id" class="cat-item">
            <span class="material-symbols-rounded cat-icon">{{ cat.icon }}</span>
            <span class="cat-name">{{ cat.name }}</span>
            <button class="delete-cat-btn" @click="handleDeleteCategory(cat.id)">
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>
        </div>

        <!-- Add category form -->
        <div class="add-form">
          <h3 class="add-title">カテゴリを追加</h3>
          <div class="add-row">
            <input
              v-model="newName"
              type="text"
              class="input-field"
              placeholder="カテゴリ名"
            />
            <input
              v-model="newIcon"
              type="text"
              class="input-field icon-input"
              placeholder="アイコン名"
            />
          </div>
          <p class="icon-hint">
            アイコン名は
            <a href="https://fonts.google.com/icons" target="_blank" rel="noopener">
              Material Symbols
            </a>
            で確認できます
          </p>
          <div v-if="newIcon" class="icon-preview">
            <span class="material-symbols-rounded" style="font-size:28px">{{ newIcon }}</span>
            <span>プレビュー</span>
          </div>
          <div v-if="addError" class="error-msg">
            <span class="material-symbols-rounded">error</span>{{ addError }}
          </div>
          <button class="btn-primary" :disabled="!newName.trim()" @click="handleAddCategory">
            追加する
          </button>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useCategories } from '@/composables/useCategories'
import BottomNav from '@/components/BottomNav.vue'
import type { TransactionKind } from '@/types'

const router = useRouter()
const { user, logout } = useAuth()
const uid = user.value!.uid
const { categories, loading, fetchCategories, addCategory, deleteCategory } = useCategories(uid)

const activeKind = ref<TransactionKind>('expense')
const newName = ref('')
const newIcon = ref('category')
const addError = ref<string | null>(null)

onMounted(() => fetchCategories())

const filteredCategories = computed(() =>
  categories.value.filter((c) => c.kind === activeKind.value),
)

const handleAddCategory = async () => {
  if (!newName.value.trim()) return
  addError.value = null
  try {
    await addCategory({
      name: newName.value.trim(),
      kind: activeKind.value,
      icon: newIcon.value.trim() || 'category',
      order: categories.value.length,
    })
    newName.value = ''
    newIcon.value = 'category'
  } catch (e: any) {
    addError.value = e.message
  }
}

const handleDeleteCategory = async (id: string) => {
  await deleteCategory(id)
}

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>

<style scoped>
.settings-header {
  background: var(--color-surface);
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--color-border);
}

.page-title {
  font-size: 20px;
  font-weight: 700;
}

.settings-section {
  padding: 20px 16px;
  border-bottom: 8px solid var(--color-bg);
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 16px;
}

.user-card {
  background: var(--color-bg);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 700;
  font-size: 15px;
}

.user-email {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-expense);
  font-size: 11px;
  font-weight: 600;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}
.logout-btn:hover { background: rgba(239, 68, 68, 0.08); }

.loading {
  text-align: center;
  padding: 20px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.cat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.cat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--color-bg);
  border-radius: 12px;
}

.cat-icon {
  color: var(--color-primary);
  font-size: 22px;
}

.cat-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
}

.delete-cat-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.2s;
}
.delete-cat-btn:hover { color: var(--color-expense); }

.add-form {
  background: var(--color-bg);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-title {
  font-size: 14px;
  font-weight: 700;
}

.add-row {
  display: flex;
  gap: 10px;
}

.icon-input {
  width: 140px;
  flex-shrink: 0;
}

.icon-hint {
  font-size: 11px;
  color: var(--color-text-muted);
}

.icon-hint a {
  color: var(--color-primary);
}

.icon-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
  font-size: 13px;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff1f1;
  color: var(--color-expense);
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}
</style>
