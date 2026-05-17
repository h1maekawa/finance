import { ref, computed } from 'vue'
import type { Category } from '@/types'

const defaultCategories: Category[] = [
  // 支出カテゴリ (Expense)
  { id: 'exp-1', name: '食費', kind: 'expense', icon: 'restaurant', order: 1 },
  { id: 'exp-2', name: '日用品', kind: 'expense', icon: 'shopping_bag', order: 2 },
  { id: 'exp-3', name: '交通費', kind: 'expense', icon: 'train', order: 3 },
  { id: 'exp-4', name: '交際費', kind: 'expense', icon: 'sports_esports', order: 4 },
  { id: 'exp-5', name: '住居・光熱費', kind: 'expense', icon: 'home', order: 5 },
  { id: 'exp-6', name: '通信費', kind: 'expense', icon: 'phone_iphone', order: 6 },
  { id: 'exp-7', name: '美容・衣服', kind: 'expense', icon: 'apparel', order: 7 },
  { id: 'exp-8', name: 'その他', kind: 'expense', icon: 'category', order: 8 },

  // 収入カテゴリ (Income)
  { id: 'inc-1', name: '給与', kind: 'income', icon: 'payments', order: 1 },
  { id: 'inc-2', name: 'お小遣い', kind: 'income', icon: 'savings', order: 2 },
  { id: 'inc-3', name: 'その他', kind: 'income', icon: 'add_card', order: 3 },
]

export function useCategories(_uid?: string) {
  const categories = ref<Category[]>(defaultCategories)
  const loading = ref(false)

  const incomeCategories = computed(() => categories.value.filter((c) => c.kind === 'income'))
  const expenseCategories = computed(() => categories.value.filter((c) => c.kind === 'expense'))

  async function fetchCategories() {
    // 静的カテゴリのため、ローカル値を即座に解決
    categories.value = defaultCategories
  }

  return {
    categories,
    incomeCategories,
    expenseCategories,
    loading,
    fetchCategories,
  }
}
