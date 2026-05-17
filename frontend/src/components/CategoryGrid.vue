<template>
  <div class="category-grid">
    <button
      v-for="cat in categories"
      :key="cat.id"
      class="cat-btn"
      :class="{ selected: modelValue === cat.name }"
      @click="$emit('update:modelValue', cat.name)"
    >
      <span class="material-symbols-rounded cat-icon">{{ cat.icon }}</span>
      <span class="cat-name">{{ cat.name }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Category } from '@/types'

defineProps<{
  categories: Category[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 4px;
  border-radius: 12px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-text-muted);
}

.cat-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.cat-btn.selected {
  border-color: var(--color-primary);
  background: rgba(26, 86, 219, 0.06);
  color: var(--color-primary);
}

.cat-icon {
  font-size: 22px;
}

.cat-name {
  font-size: 11px;
  font-weight: 500;
  text-align: center;
}
</style>
