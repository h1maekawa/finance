import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { sessionStore } from '@/stores/session'
import type { Stock } from '@/types/db'

type StockInput = {
  symbol: string
  account_type: string
  shares: number
  average_price: number
}

export function useStocks() {
  const stocks = ref<Stock[]>([])
  const loading = ref(false)
  const updatingPrices = ref(false)
  const updateErrors = ref<string[]>([])

  const totalEvaluationAmount = computed(() =>
    stocks.value.reduce((sum, s) => sum + Number(s.evaluation_amount ?? 0), 0),
  )

  async function fetchStocks() {
    const userId = sessionStore.user?.id
    if (!userId) {
      stocks.value = []
      return
    }

    loading.value = true
    const { data, error } = await supabase
      .from('stocks')
      .select(`
        id,
        user_id,
        symbol,
        account_type,
        shares,
        average_price,
        current_price,
        evaluation_amount,
        profit_loss,
        profit_loss_rate,
        updated_at
      `)
      .eq('user_id', userId)
      .order('symbol', { ascending: true })
    loading.value = false

    if (error) throw error
    stocks.value = (data ?? []) as Stock[]
  }

  async function addStock(input: StockInput) {
    const userId = sessionStore.user?.id
    if (!userId) throw new Error('ログイン情報がありません。')

    const payload = {
      user_id: userId,
      symbol: input.symbol.trim().toUpperCase(),
      account_type: input.account_type.trim(),
      shares: Math.max(0, Number(input.shares || 0)),
      average_price: Math.max(0, Number(input.average_price || 0)),
      current_price: 0,
      evaluation_amount: 0,
      profit_loss: 0,
      profit_loss_rate: 0,
    }

    const { error } = await supabase.from('stocks').insert(payload)
    if (error) throw error
    await fetchStocks()
  }

  async function deleteStock(id: string) {
    const { error } = await supabase.from('stocks').delete().eq('id', id)
    if (error) throw error
    stocks.value = stocks.value.filter((s) => s.id !== id)
  }

  async function updatePrices() {
    updatingPrices.value = true
    updateErrors.value = []
    const { data, error } = await supabase.functions.invoke('update-stock-prices', {
      method: 'POST',
    })
    updatingPrices.value = false

    if (error) {
      throw new Error(error.message)
    }

    const payload = (data ?? {}) as { errors?: string[] }
    updateErrors.value = payload.errors ?? []
    await fetchStocks()
  }

  return {
    stocks,
    loading,
    updatingPrices,
    updateErrors,
    totalEvaluationAmount,
    fetchStocks,
    addStock,
    deleteStock,
    updatePrices,
  }
}
