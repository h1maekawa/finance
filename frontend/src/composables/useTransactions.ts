import { ref, computed, onUnmounted } from 'vue'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Transaction, TransactionInput, MonthlySummary } from '@/types'

export function useTransactions(userId: string) {
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribeListener: Unsubscribe | null = null

  const fetchByMonth = async (year: number, month: number) => {
    loading.value = true
    error.value = null

    if (unsubscribeListener) {
      unsubscribeListener()
      unsubscribeListener = null
    }

    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`
      const q = query(
        collection(db, `users/${userId}/transactions`),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc'),
      )

      unsubscribeListener = onSnapshot(
        q,
        (snap) => {
          transactions.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction))
          loading.value = false
        },
        (err) => {
          console.error(err)
          error.value = 'リアルタイムデータの取得に失敗しました'
          loading.value = false
        }
      )
    } catch (e: any) {
      error.value = e.message ?? '取引の取得に失敗しました'
      loading.value = false
    }
  }

  onUnmounted(() => {
    if (unsubscribeListener) {
      unsubscribeListener()
    }
  })

  const addTransaction = async (input: TransactionInput) => {
    loading.value = true
    error.value = null
    try {
      await addDoc(collection(db, `users/${userId}/transactions`), {
        ...input,
        createdAt: serverTimestamp(),
      })
    } catch (e: any) {
      error.value = e.message ?? '保存に失敗しました'
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteTransaction = async (transactionId: string) => {
    error.value = null
    try {
      await deleteDoc(doc(db, `users/${userId}/transactions/${transactionId}`))
    } catch (e: any) {
      error.value = e.message ?? '削除に失敗しました'
    }
  }

  const updateTransaction = async (transactionId: string, updates: Partial<TransactionInput>) => {
    error.value = null
    try {
      await updateDoc(doc(db, `users/${userId}/transactions/${transactionId}`), updates)
    } catch (e: any) {
      error.value = e.message ?? '更新に失敗しました'
      throw e
    }
  }

  const summary = computed<MonthlySummary>(() => {
    const income = transactions.value
      .filter((t) => t.kind === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.value
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    return { income, expense, balance: income - expense }
  })

  const recentTransactions = computed(() => transactions.value.slice(0, 5))

  const groupedByDate = computed(() => {
    const groups: Record<string, Transaction[]> = {}
    for (const t of transactions.value) {
      if (!groups[t.date]) groups[t.date] = []
      groups[t.date].push(t)
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  })

  const categoryExpenses = computed(() => {
    const map: Record<string, number> = {}
    for (const t of transactions.value.filter((t) => t.kind === 'expense')) {
      map[t.category] = (map[t.category] ?? 0) + t.amount
    }
    return map
  })

  return {
    transactions,
    loading,
    error,
    fetchByMonth,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    summary,
    recentTransactions,
    groupedByDate,
    categoryExpenses,
  }
}
