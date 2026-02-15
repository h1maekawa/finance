import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Transaction, TransactionKind } from '@/types/db'

export function useTransactions(householdId: () => string | null) {
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const selectedMonth = ref(new Date())

  const monthRange = computed(() => {
    const d = selectedMonth.value
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    }
  })

  const totalIncome = computed(() =>
    transactions.value
      .filter((t) => t.kind === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const totalExpense = computed(() =>
    transactions.value
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const balance = computed(() => totalIncome.value - totalExpense.value)

  async function fetchTransactions() {
    const hid = householdId()
    if (!hid) return

    loading.value = true
    const { data, error } = await supabase
      .from('transactions')
      .select('id, household_id, user_id, category_id, kind, amount, transaction_date, note')
      .eq('household_id', hid)
      .gte('transaction_date', monthRange.value.start)
      .lt('transaction_date', monthRange.value.end)
      .order('transaction_date', { ascending: false })

    loading.value = false
    if (error) throw error
    transactions.value = (data ?? []) as Transaction[]
  }

  async function createTransaction(payload: {
    category_id: string
    kind: TransactionKind
    amount: number
    transaction_date: string
    note?: string | null
    user_id: string
  }) {
    const hid = householdId()
    if (!hid) throw new Error('No household selected')

    const { error } = await supabase.from('transactions').insert({
      household_id: hid,
      ...payload,
    })

    if (error) throw error
    await fetchTransactions()
  }

  async function updateTransaction(id: string, patch: Partial<Transaction>) {
    const { error } = await supabase.from('transactions').update(patch).eq('id', id)
    if (error) throw error
    await fetchTransactions()
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
    transactions.value = transactions.value.filter((t) => t.id !== id)
  }

  watch([() => householdId(), selectedMonth], fetchTransactions, { immediate: true })

  return {
    transactions,
    loading,
    selectedMonth,
    monthRange,
    totalIncome,
    totalExpense,
    balance,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  }
}
