<template>
  <div class="entry-page">
    <!-- Header -->
    <div class="entry-header">
      <button class="back-btn" @click="router.back()">
        <span class="material-symbols-rounded">arrow_back</span>
      </button>
      <h1>取引を入力</h1>
      <div style="width:40px"></div>
    </div>

    <div class="entry-body">
      <!-- Kind Toggle -->
      <div class="toggle-group">
        <button
          class="toggle-btn"
          :class="{ 'active-expense': kind === 'expense' }"
          @click="kind = 'expense'"
        >支出</button>
        <button
          class="toggle-btn"
          :class="{ 'active-income': kind === 'income' }"
          @click="kind = 'income'"
        >収入</button>
      </div>

      <!-- Amount Display -->
      <div class="amount-display" :class="kind">
        <span class="amount-prefix">¥</span>
        <span class="amount-value">{{ displayAmount }}</span>
      </div>

      <!-- Numpad -->
      <div class="numpad">
        <button v-for="key in numpadKeys" :key="key" class="numpad-btn" :class="{ delete: key === '⌫' }" @click="handleNumpad(key)">
          {{ key }}
        </button>
      </div>

      <!-- Category -->
      <div class="form-section">
        <label class="form-label">カテゴリ</label>
        <div v-if="categoriesLoading" class="loading-sm">読み込み中...</div>
        <CategoryGrid
          v-else
          :categories="filteredCategories"
          v-model="selectedCategory"
        />
      </div>

      <!-- Date -->
      <div class="form-section">
        <label class="form-label">日付</label>
        <input v-model="date" type="date" class="input-field" />
      </div>

      <!-- Note -->
      <div class="form-section">
        <label class="form-label">メモ（任意）</label>
        <input v-model="note" type="text" class="input-field" placeholder="メモを入力..." />
      </div>

      <!-- Error -->
      <div v-if="error" class="error-msg">
        <span class="material-symbols-rounded">error</span>
        {{ error }}
      </div>

      <!-- Save -->
      <button
        class="btn-primary save-btn"
        :disabled="!canSave || loading"
        @click="handleSave"
      >
        <span v-if="loading">保存中...</span>
        <span v-else>保存する</span>
      </button>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import BottomNav from '@/components/BottomNav.vue'
import CategoryGrid from '@/components/CategoryGrid.vue'
import type { TransactionKind } from '@/types'

const router = useRouter()
const { user } = useAuth()
const uid = user.value!.uid

const { addTransaction, loading, error } = useTransactions(uid)
const { categories, loading: categoriesLoading, fetchCategories } = useCategories(uid)

onMounted(() => fetchCategories())

const kind = ref<TransactionKind>('expense')
const amountStr = ref('0')
const selectedCategory = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const note = ref('')

const displayAmount = computed(() =>
  new Intl.NumberFormat('ja-JP').format(parseInt(amountStr.value) || 0),
)

const filteredCategories = computed(() =>
  categories.value.filter((c) => c.kind === kind.value),
)

const canSave = computed(
  () => parseInt(amountStr.value) > 0 && selectedCategory.value !== '',
)

const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫']

const handleNumpad = (key: string) => {
  if (key === '⌫') {
    amountStr.value = amountStr.value.length > 1
      ? amountStr.value.slice(0, -1)
      : '0'
    return
  }
  if (amountStr.value === '0') {
    amountStr.value = key
  } else {
    const next = amountStr.value + key
    if (parseInt(next) > 9_999_999) return
    amountStr.value = next
  }
}

const handleSave = async () => {
  if (!canSave.value) return
  try {
    await addTransaction({
      kind: kind.value,
      amount: parseInt(amountStr.value),
      category: selectedCategory.value,
      date: date.value,
      note: note.value || null,
    })
    router.push('/home')
  } catch {}
}
</script>

<style scoped>
.entry-page {
  min-height: 100vh;
  background: var(--color-bg);
}

.entry-header {
  background: var(--color-surface);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}

.entry-header h1 {
  font-size: 18px;
  font-weight: 700;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition: background 0.2s;
}
.back-btn:hover { background: var(--color-bg); }

.entry-body {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: calc(var(--bottom-nav-height) + 80px);
}

.amount-display {
  text-align: center;
  padding: 16px;
  background: var(--color-surface);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.amount-prefix {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.amount-value {
  font-size: 40px;
  font-weight: 700;
  font-feature-settings: 'tnum';
  letter-spacing: -0.02em;
}

.amount-display.expense .amount-value { color: var(--color-expense); }
.amount-display.income .amount-value { color: var(--color-income); }

.form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.loading-sm {
  color: var(--color-text-muted);
  font-size: 14px;
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

.save-btn {
  margin-top: 8px;
}
</style>
