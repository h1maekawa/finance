<template>
  <div class="tx-card" :class="transaction.kind" @click="$emit('edit', transaction.id)">
    <div class="tx-left">
      <div class="tx-icon">
        <span class="material-symbols-rounded">{{ icon }}</span>
      </div>
      <div class="tx-info">
        <span class="tx-category">{{ transaction.category }}</span>
        <span v-if="transaction.note" class="tx-note">{{ transaction.note }}</span>
      </div>
    </div>
    <div class="tx-right">
      <span class="tx-amount" :class="transaction.kind">
        {{ transaction.kind === 'income' ? '+' : '-' }}{{ formatAmount(transaction.amount) }}
      </span>
      <button v-if="showDelete" class="delete-btn" @click.stop="$emit('delete', transaction.id)">
        <span class="material-symbols-rounded">delete</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Transaction } from '@/types'

const props = defineProps<{
  transaction: Transaction
  icon?: string
  showDelete?: boolean
}>()

defineEmits<{
  delete: [id: string]
  edit: [id: string]
}>()

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('ja-JP').format(amount) + '円'
</script>

<style scoped>
.tx-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--color-bg);
  gap: 12px;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.tx-card:active {
  transform: scale(0.98);
}

.tx-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.tx-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  flex-shrink: 0;
}

.income .tx-icon { color: var(--color-income); }
.expense .tx-icon { color: var(--color-expense); }

.tx-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tx-category {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text);
}

.tx-note {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.tx-amount {
  font-weight: 700;
  font-size: 15px;
}

.tx-amount.income { color: var(--color-income); }
.tx-amount.expense { color: var(--color-expense); }

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.delete-btn:hover { color: var(--color-expense); }
.delete-btn .material-symbols-rounded { font-size: 18px; }
</style>
