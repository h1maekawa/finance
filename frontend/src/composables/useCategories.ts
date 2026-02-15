import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Category, TransactionKind } from '@/types/db'

export function useCategories(householdId: () => string | null) {
  const categories = ref<Category[]>([])
  const loading = ref(false)

  const incomeCategories = computed(() => categories.value.filter((c) => c.kind === 'income'))
  const expenseCategories = computed(() => categories.value.filter((c) => c.kind === 'expense'))

  async function fetchCategories() {
    const hid = householdId()
    if (!hid) return

    loading.value = true
    const { data, error } = await supabase
      .from('categories')
      .select('id, household_id, name, kind, color, icon, sort_order')
      .eq('household_id', hid)
      .order('sort_order', { ascending: true })

    loading.value = false
    if (error) throw error
    categories.value = (data ?? []) as Category[]
  }

  async function createCategory(payload: {
    name: string
    kind: TransactionKind
    color?: string | null
    icon?: string | null
    sort_order?: number
  }) {
    const hid = householdId()
    if (!hid) throw new Error('No household selected')

    const { error } = await supabase.from('categories').insert({
      household_id: hid,
      ...payload,
    })

    if (error) throw error
    await fetchCategories()
  }

  async function updateCategory(id: string, patch: Partial<Category>) {
    const { error } = await supabase.from('categories').update(patch).eq('id', id)
    if (error) throw error
    await fetchCategories()
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    categories.value = categories.value.filter((c) => c.id !== id)
  }

  watch(() => householdId(), fetchCategories, { immediate: true })

  return {
    categories,
    incomeCategories,
    expenseCategories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
