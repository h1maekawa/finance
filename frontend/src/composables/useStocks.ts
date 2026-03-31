import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { sessionStore } from '@/stores/session'
import type { Stock } from '@/types/db'
// import {
//   appendInvestmentToSheet,
//   deleteInvestmentFromSheet,
//   fetchInvestmentRowsFromSheet,
//   type SheetInvestmentRow,
// } from '@/services/sheetsService'

type StockInput = {
  symbol: string
  name: string
  type: 'stock' | 'fund' | 'us_stock' | 'jp_stock' | 'etf'
  account_type?: string
  quantity: number
  average_price: number
  current_price?: number | null
  evaluation_amount?: number | null
}

export function useStocks() {
  const stocks = ref<Stock[]>([])
  const loading = ref(false)
  const updatingPrices = ref(false)
  const updateErrors = ref<string[]>([])
  const sheetError = ref('')

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
    const manualEvaluation = Math.max(0, Number(input.evaluation_amount ?? 0))
    
    // Type and symbol normalization
    let type = input.type as any
    if (type === 'stock') {
        type = /^[0-9]{4}$/.test(input.symbol) ? 'jp_stock' : 'us_stock'
    }

    const evaluationAmount = input.type === 'fund'
      ? manualEvaluation
      : currentPrice * quantity
    const costAmount = averagePrice * quantity
    const profitLoss = evaluationAmount - costAmount
    const profitLossRate = costAmount > 0
      ? (profitLoss / costAmount) * 100
      : 0

    const payload = {
      user_id: userId,
      type: type,
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
    const target = stocks.value.find((s) => s.id === id)
    if (!target) {
      throw new Error('対象データが見つかりません。')
    }

    const { error } = await supabase.from('investments').delete().eq('id', id)
    if (error) throw error
    stocks.value = stocks.value.filter((s) => s.id !== id)
  }

  async function fetchLivePrices() {
    if (stocks.value.length === 0) return
    updatingPrices.value = true
    updateErrors.value = []

    try {
      const etfList = ['QQQ', 'VOO', 'SPY', 'VTI', 'IVV', 'EEM', 'GLD', 'TLT', 'VEA', 'VWO']
      const payloadSymbols = stocks.value.map(s => {
        let type = s.type as string
        if (type === 'jp_stock' || type === 'us_stock' || type === 'etf' || type === 'fund') {
            // ok
        } else if (type === 'stock') {
            type = /^[0-9]{4}$/.test(s.symbol) ? 'jp_stock' : 'us_stock'
            if (etfList.includes(s.symbol.toUpperCase())) type = 'etf'
        }
        return { symbol: s.symbol, type: type }
      })

      const response = await fetch('/api/prices/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: payloadSymbols })
      })
      const { results } = await response.json()

      for (const res of results) {
        if (res.error) {
          updateErrors.value.push(`${res.symbol}: ${res.error}`)
          continue
        }

        const stock = stocks.value.find(s => s.symbol.toUpperCase() === res.symbol.toUpperCase())
        if (!stock) continue

        const currentPriceJpy = res.currentPriceJpy || res.currentPrice
        const quantity = Number(stock.quantity)
        const averagePrice = Number(stock.average_price)
        const evaluationAmount = Math.round(quantity * currentPriceJpy)
        const profitLoss = evaluationAmount - Math.round(quantity * averagePrice)
        const profitLossRate = (profitLoss / (quantity * averagePrice)) * 100

        await supabase.from('investments').update({
          current_price: currentPriceJpy,
          evaluation_amount: evaluationAmount,
          profit_loss: profitLoss,
          profit_loss_rate: profitLossRate,
          updated_at: new Date().toISOString()
        }).eq('id', stock.id)
      }

      await fetchStocks()
    } catch (e) {
      console.error('Fetch prices error:', e)
      updateErrors.value.push('価格情報の取得に失敗しました。')
    } finally {
      updatingPrices.value = false
    }
  }

  async function updateFundPrice(id: string, nextCurrentPrice: number, nextEvaluationAmount: number) {
    const row = stocks.value.find((item) => item.id === id)
    if (!row) {
      throw new Error('対象データが見つかりません。')
    }
    // if (row.type !== 'fund') {
    //   throw new Error('投資信託のみ手動価格更新できます。')
    // }

    const currentPrice = Math.max(0, Number(nextCurrentPrice || 0))
    const averagePrice = Number(row.average_price ?? 0)
    const quantity = Number(row.quantity ?? 0)
    const evaluationAmount = Math.max(0, Number(nextEvaluationAmount || 0))
    const costAmount = averagePrice * quantity
    const profitLoss = evaluationAmount - costAmount
    const profitLossRate = costAmount > 0
      ? (profitLoss / costAmount) * 100
      : 0

    const { error } = await supabase
      .from('investments')
      .update({
        current_price: currentPrice,
        evaluation_amount: evaluationAmount,
        profit_loss: profitLoss,
        profit_loss_rate: profitLossRate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
    await fetchStocks()
  }

  async function fetchSheetRows(_type: 'stock' | 'fund' | 'all' = 'all') {
    return []
  }

  async function updatePrices(_usdJpyRate = 150) {
    await fetchLivePrices()
  }

  watch(
    () => sessionStore.user?.id,
    (userId) => {
      if (!userId) {
        return
      }
      void fetchStocks()
    },
    { immediate: true },
  )

  return {
    stocks,
    loading,
    updatingPrices,
    updateErrors,
    sheetError,
    totalEvaluationAmount,
    fetchStocks,
    fetchSheetRows,
    fetchLivePrices,
    addStock,
    deleteStock,
    updateFundPrice,
    updatePrices,
  }
}
