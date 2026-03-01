import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { sessionStore } from '@/stores/session'
import type { Stock } from '@/types/db'

type StockInput = {
  symbol: string
  name: string
  type: 'stock' | 'fund'
  account_type?: string
  quantity: number
  average_price: number
  current_price?: number | null
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
      .from('investments')
      .select(`
        id,
        user_id,
        type,
        symbol,
        name,
        account_type,
        quantity,
        average_price,
        current_price,
        evaluation_amount,
        profit_loss,
        profit_loss_rate,
        updated_at
      `)
      .eq('user_id', userId)
      .order('name', { ascending: true })
    loading.value = false

    if (error) throw error
    stocks.value = ((data ?? []) as Stock[]).map((row) => ({
      ...row,
      quantity: Number(row.quantity ?? 0),
      average_price: Number(row.average_price ?? 0),
      current_price: Number(row.current_price ?? 0),
      evaluation_amount: Number(row.evaluation_amount ?? 0),
      profit_loss: Number(row.profit_loss ?? 0),
      profit_loss_rate: Number(row.profit_loss_rate ?? 0),
    }))
  }

  async function addStock(input: StockInput) {
    const userId = sessionStore.user?.id
    if (!userId) throw new Error('ログイン情報がありません。')

    const quantity = Math.max(0, Number(input.quantity || 0))
    const averagePrice = Math.max(0, Number(input.average_price || 0))
    const currentPrice = Math.max(0, Number(input.current_price ?? averagePrice))
    const evaluationAmount = currentPrice * quantity
    const profitLoss = (currentPrice - averagePrice) * quantity
    const profitLossRate = averagePrice > 0
      ? ((currentPrice - averagePrice) / averagePrice) * 100
      : 0

    const payload = {
      user_id: userId,
      type: input.type,
      symbol: input.symbol.trim().toUpperCase(),
      name: input.name.trim() || input.symbol.trim().toUpperCase(),
      account_type: input.account_type?.trim() || '未設定',
      quantity,
      average_price: averagePrice,
      current_price: currentPrice,
      evaluation_amount: evaluationAmount,
      profit_loss: profitLoss,
      profit_loss_rate: profitLossRate,
    }

    const { error } = await supabase.from('investments').insert(payload)
    if (error) throw error
    await fetchStocks()
  }

  async function deleteStock(id: string) {
    const { error } = await supabase.from('investments').delete().eq('id', id)
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

  watch(
    () => sessionStore.user?.id,
    () => void fetchStocks(),
    { immediate: true },
  )

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
