import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { sessionStore } from '@/stores/session'
import type { Stock } from '@/types/db'
import {
  appendInvestmentToSheet,
  deleteInvestmentFromSheet,
  fetchInvestmentRowsFromSheet,
  type SheetInvestmentRow,
} from '@/services/sheetsService'

type StockInput = {
  symbol: string
  name: string
  type: 'stock' | 'fund'
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
  const syncingSheet = ref(false)
  const sheetLoading = ref(false)
  const sheetError = ref('')
  const sheetRows = ref<SheetInvestmentRow[]>([])

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

    // 既存機能を壊さないため、Sheets同期失敗でも登録自体は成功とする
    syncingSheet.value = true
    try {
      await appendInvestmentToSheet({
        symbol: payload.symbol,
        name: payload.name,
        quantity: payload.quantity,
      })
      sheetError.value = ''
      await fetchSheetRows()
    } catch (sheetSyncError) {
      sheetError.value = sheetSyncError instanceof Error
        ? sheetSyncError.message
        : 'Google Sheets への同期に失敗しました。'
    } finally {
      syncingSheet.value = false
    }

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

    try {
      await deleteInvestmentFromSheet({
        symbol: target.symbol,
        name: target.name,
      })
      await fetchSheetRows()
    } catch (sheetDeleteError) {
      sheetError.value = sheetDeleteError instanceof Error
        ? sheetDeleteError.message
        : 'Google Sheets の削除同期に失敗しました。'
    }
  }

  async function updateFundPrice(id: string, nextCurrentPrice: number, nextEvaluationAmount: number) {
    const row = stocks.value.find((item) => item.id === id)
    if (!row) {
      throw new Error('対象データが見つかりません。')
    }
    if (row.type !== 'fund') {
      throw new Error('投資信託のみ手動価格更新できます。')
    }

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

  async function fetchSheetRows() {
    sheetLoading.value = true
    try {
      const rows = await fetchInvestmentRowsFromSheet()
      sheetRows.value = rows
      sheetError.value = ''
      return rows
    } catch (error) {
      sheetError.value = error instanceof Error ? error.message : 'Google Sheets の取得に失敗しました。'
      throw error
    } finally {
      sheetLoading.value = false
    }
  }

  function buildSheetKey(symbol: string, name: string) {
    return `${symbol.trim().toUpperCase()}::${name.trim()}`
  }

  async function updatePrices(usdJpyRate = 150) {
    updatingPrices.value = true
    updateErrors.value = []
    try {
      const rows = await fetchSheetRows()
      const rowMap = new Map<string, SheetInvestmentRow>()
      for (const row of rows) {
        rowMap.set(buildSheetKey(row.symbol, row.name), row)
      }

      for (const stock of stocks.value.filter((s) => s.type === 'stock')) {
        const key = buildSheetKey(stock.symbol, stock.name)
        const matched = rowMap.get(key)
        if (!matched) {
          updateErrors.value.push(`${stock.symbol}: Sheetsに一致データがありません`)
          continue
        }

        const currentPrice = Number(matched.currentPrice ?? 0)
        if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
          updateErrors.value.push(`${stock.symbol}: 現在価格が不正です`)
          continue
        }

        const quantity = Number(stock.quantity ?? 0)
        const averagePrice = Number(stock.average_price ?? 0)
        const fx = Math.max(1, Number(usdJpyRate || 0))
        const evaluationAmount = currentPrice * fx * quantity
        const costAmount = averagePrice * quantity
        const profitLossYen = evaluationAmount - costAmount
        const profitLossRate = costAmount > 0
          ? (profitLossYen / costAmount) * 100
          : 0

        const { error } = await supabase
          .from('investments')
          .update({
            current_price: currentPrice,
            evaluation_amount: evaluationAmount,
            profit_loss: profitLossYen,
            profit_loss_rate: profitLossRate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', stock.id)

        if (error) {
          updateErrors.value.push(`${stock.symbol}: ${error.message}`)
        }
      }

      await fetchStocks()
    } finally {
      updatingPrices.value = false
    }
  }

  watch(
    () => sessionStore.user?.id,
    (userId) => {
      if (!userId) {
        sheetRows.value = []
        return
      }
      void fetchStocks()
      void fetchSheetRows()
    },
    { immediate: true },
  )

  return {
    stocks,
    loading,
    updatingPrices,
    updateErrors,
    syncingSheet,
    sheetLoading,
    sheetError,
    sheetRows,
    totalEvaluationAmount,
    fetchStocks,
    fetchSheetRows,
    addStock,
    deleteStock,
    updateFundPrice,
    updatePrices,
  }
}
