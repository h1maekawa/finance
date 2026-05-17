<template>
  <div class="page-content">
    <!-- Header -->
    <div class="history-header">
      <h1 class="page-title">取引履歴</h1>
      <div class="month-nav">
        <button class="month-btn" @click="changeMonth(-1)">
          <span class="material-symbols-rounded">chevron_left</span>
        </button>
        <span class="month-text">{{ currentMonthLabel }}</span>
        <button class="month-btn" @click="changeMonth(1)">
          <span class="material-symbols-rounded">chevron_right</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="groupedByDate.length === 0" class="empty-state">
      <span class="material-symbols-rounded">receipt_long</span>
      <p>この月の取引はありません</p>
    </div>

    <div v-else class="history-list">
      <div v-for="[date, txs] in groupedByDate" :key="date" class="date-group">
        <div class="date-header">
          <span class="date-label">{{ formatDate(date) }}</span>
          <span class="date-summary">
            {{ formatDayTotal(txs) }}
          </span>
        </div>
        <div class="tx-list">
          <TransactionCard
            v-for="tx in txs"
            :key="tx.id"
            :transaction="tx"
            :icon="getCategoryIcon(tx.category)"
            :show-delete="true"
            @delete="handleDelete"
            @edit="handleEdit"
          />
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <h3 class="modal-title">カテゴリの変更</h3>
        <p v-if="editingTransaction" class="modal-subtitle">
          {{ editingTransaction.note || '対象データ' }}
        </p>

        <CategoryGrid
          v-if="editingTransaction"
          :categories="availableCategories"
          v-model="selectedCategory"
        />

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeEditModal">キャンセル</button>
          <button class="btn btn-primary" @click="saveEdit" :disabled="!selectedCategory || isSaving">
            {{ isSaving ? '保存中...' : '保存する' }}
          </button>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import BottomNav from '@/components/BottomNav.vue'
import TransactionCard from '@/components/TransactionCard.vue'
import CategoryGrid from '@/components/CategoryGrid.vue'
import type { Transaction } from '@/types'

const { user } = useAuth()
const uid = user.value!.uid

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)

const { loading, groupedByDate, fetchByMonth, deleteTransaction, updateTransaction, transactions } = useTransactions(uid)
const { categories, fetchCategories } = useCategories(uid)

onMounted(async () => {
  await fetchCategories()
  await fetchByMonth(currentYear.value, currentMonth.value)
})

watch([currentYear, currentMonth], ([y, m]) => fetchByMonth(y, m))

const currentMonthLabel = computed(() => `${currentYear.value}年${currentMonth.value}月`)

const changeMonth = (delta: number) => {
  let m = currentMonth.value + delta
  let y = currentYear.value
  if (m > 12) { m = 1; y++ }
  if (m < 1) { m = 12; y-- }
  currentMonth.value = m
  currentYear.value = y
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
}

const formatDayTotal = (txs: Transaction[]) => {
  const income = txs.filter(t => t.kind === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter(t => t.kind === 'expense').reduce((s, t) => s + t.amount, 0)
  const parts = []
  if (income > 0) parts.push(`+${fmt(income)}`)
  if (expense > 0) parts.push(`-${fmt(expense)}`)
  return parts.join(' / ')
}

const fmt = (n: number) => new Intl.NumberFormat('ja-JP').format(n) + '円'

const getCategoryIcon = (name: string) => {
  const cat = categories.value.find(c => c.name === name)
  return cat?.icon ?? 'category'
}

const handleDelete = async (id: string) => {
  await deleteTransaction(id)
}

// Edit Modal State
const showEditModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const selectedCategory = ref('')
const isSaving = ref(false)

const handleEdit = (id: string) => {
  const tx = transactions.value.find(t => t.id === id)
  if (tx) {
    editingTransaction.value = tx
    selectedCategory.value = tx.category
    showEditModal.value = true
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  editingTransaction.value = null
  selectedCategory.value = ''
}

const availableCategories = computed(() => {
  if (!editingTransaction.value) return []
  return categories.value.filter(c => c.kind === editingTransaction.value!.kind)
})

const saveEdit = async () => {
  if (!editingTransaction.value || !selectedCategory.value) return
  isSaving.value = true
  try {
    await updateTransaction(editingTransaction.value.id, {
      category: selectedCategory.value
    })
    closeEditModal()
  } catch (e) {
    console.error(e)
    alert('保存に失敗しました')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.history-header {
  background: var(--color-surface);
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.month-btn {
  background: var(--color-bg);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text);
  transition: background 0.2s;
}
.month-btn:hover { background: var(--color-border); }

.month-text {
  font-size: 16px;
  font-weight: 600;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-muted);
}
.empty-state .material-symbols-rounded {
  font-size: 56px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.3;
}

.history-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}


.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
  margin-bottom: 8px;
}

.date-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.date-summary {
  font-size: 12px;
  color: var(--color-text-muted);
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
  animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--color-bg);
  width: 100%;
  max-width: 500px;
  border-radius: 20px 20px 0 0;
  padding: 24px;
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 -4px 24px rgba(0,0,0,0.1);
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  text-align: center;
}

.modal-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: center;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}

.btn:active {
  opacity: 0.8;
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:disabled {
  background: var(--color-text-muted);
  cursor: not-allowed;
}
</style>
