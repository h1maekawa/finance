import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type { InvestmentAsset } from '@/types/db'
import { fetchQuotesByTickers, type MarketQuote } from '@/services/marketDataService'

export const ASSET_TYPES = ['投資信託', '個別株', 'ETF', 'その他'] as const

export function useInvestments(householdId: () => string | null) {
    const investments = ref<InvestmentAsset[]>([])
    const loading = ref(false)
    const quoteLoading = ref(false)
    const quoteErrors = ref<string[]>([])
    const quotesByTicker = ref<Record<string, MarketQuote>>({})

    const totalInvestments = computed(() =>
        investments.value.reduce((sum, a) => sum + getCurrentAmount(a), 0),
    )

    async function fetchInvestments() {
        const hid = householdId()
        if (!hid) {
            investments.value = []
            return
        }

        loading.value = true
        const { data, error } = await supabase
            .from('investment_assets')
            .select(`
                id,
                household_id,
                asset_type,
                name,
                amount,
                ticker,
                quantity,
                avg_cost,
                take_profit_price,
                notify_take_profit,
                last_notified_at,
                sort_order
            `)
            .eq('household_id', hid)
            .order('sort_order', { ascending: true })

        loading.value = false
        if (error) throw error

        investments.value = ((data ?? []) as InvestmentAsset[]).map((asset) => ({
            ...asset,
            quantity: Number(asset.quantity ?? 0),
            avg_cost: asset.avg_cost === null ? null : Number(asset.avg_cost),
            take_profit_price: asset.take_profit_price === null ? null : Number(asset.take_profit_price),
        }))
        await refreshQuotes()
    }

    function normalizeTicker(raw: string | null | undefined): string | null {
        const ticker = raw?.trim().toUpperCase()
        return ticker ? ticker : null
    }

    function sanitizePrice(value: number | null | undefined): number | null {
        if (value === null || value === undefined || value === 0) return null
        const n = Number(value)
        if (!Number.isFinite(n) || n <= 0) return null
        return n
    }

    function getCurrentAmount(asset: InvestmentAsset): number {
        const ticker = normalizeTicker(asset.ticker)
        const quote = ticker ? quotesByTicker.value[ticker] : null
        const quantity = Number(asset.quantity ?? 0)
        if (quote && quantity > 0) {
            return Math.max(0, Math.round(quote.price * quantity))
        }
        return Math.max(0, Math.floor(Number(asset.amount || 0)))
    }

    function getTakeProfitHit(asset: InvestmentAsset): boolean {
        if (asset.asset_type !== '個別株') return false
        if (!asset.notify_take_profit) return false
        const threshold = sanitizePrice(asset.take_profit_price)
        if (!threshold) return false
        const ticker = normalizeTicker(asset.ticker)
        if (!ticker) return false
        const quote = quotesByTicker.value[ticker]
        if (!quote) return false
        return quote.price >= threshold
    }

    async function refreshQuotes() {
        const tickers = investments.value
            .map((asset) => normalizeTicker(asset.ticker))
            .filter((ticker): ticker is string => Boolean(ticker))

        if (tickers.length === 0) {
            quotesByTicker.value = {}
            quoteErrors.value = []
            return
        }

        quoteLoading.value = true
        const result = await fetchQuotesByTickers(tickers)
        quoteLoading.value = false

        quotesByTicker.value = result.quotes
        quoteErrors.value = result.errors

        await notifyTakeProfitSignals()
    }

    async function notifyTakeProfitSignals() {
        if (typeof window === 'undefined' || !('Notification' in window)) return
        if (Notification.permission !== 'granted') return

        const nowIso = new Date().toISOString()
        const updateTargets = investments.value.filter((asset) => {
            if (!getTakeProfitHit(asset)) return false
            if (!asset.last_notified_at) return true
            const elapsed = Date.now() - new Date(asset.last_notified_at).getTime()
            return elapsed > 12 * 60 * 60 * 1000
        })

        for (const asset of updateTargets) {
            const ticker = normalizeTicker(asset.ticker)
            if (!ticker) continue
            const quote = quotesByTicker.value[ticker]
            if (!quote) continue

            new Notification(`利確タイミング: ${asset.name}`, {
                body: `${ticker} が ${quote.price.toLocaleString()} に到達しました（目標 ${Number(asset.take_profit_price ?? 0).toLocaleString()}）`,
            })

            await updateInvestment(asset.id, { last_notified_at: nowIso })
        }
    }

    async function requestNotificationPermission() {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return 'unsupported' as const
        }
        const result = await Notification.requestPermission()
        return result
    }

    async function addInvestment(
        assetType: string,
        name: string,
        amount: number,
        options?: {
            ticker?: string | null
            quantity?: number
            avgCost?: number | null
            takeProfitPrice?: number | null
            notifyTakeProfit?: boolean
        },
    ) {
        const hid = householdId()
        if (!hid) return

        const safeAmount = Math.max(0, Math.floor(Number(amount || 0)))
        const nextOrder = investments.value.length > 0
            ? Math.max(...investments.value.map((a) => a.sort_order)) + 10
            : 10

        const { data, error } = await supabase
            .from('investment_assets')
            .insert({
                household_id: hid,
                asset_type: assetType,
                name: name.trim(),
                amount: safeAmount,
                ticker: normalizeTicker(options?.ticker),
                quantity: Math.max(0, Number(options?.quantity ?? 0)),
                avg_cost: sanitizePrice(options?.avgCost),
                take_profit_price: sanitizePrice(options?.takeProfitPrice),
                notify_take_profit: Boolean(options?.notifyTakeProfit),
                sort_order: nextOrder,
            })
            .select()
            .single()

        if (error) throw error
        const inserted = data as InvestmentAsset
        investments.value.push({
            ...inserted,
            quantity: Number(inserted.quantity ?? 0),
            avg_cost: inserted.avg_cost === null ? null : Number(inserted.avg_cost),
            take_profit_price: inserted.take_profit_price === null ? null : Number(inserted.take_profit_price),
        })
    }

    async function updateInvestment(
        id: string,
        patch: Partial<
            Pick<
                InvestmentAsset,
                'asset_type' | 'name' | 'amount' | 'ticker' | 'quantity' | 'avg_cost' | 'take_profit_price' | 'notify_take_profit' | 'last_notified_at'
            >
        >,
    ) {
        const update: Record<string, unknown> = {}
        if (patch.asset_type !== undefined) update.asset_type = patch.asset_type
        if (patch.name !== undefined) update.name = patch.name.trim()
        if (patch.amount !== undefined) update.amount = Math.max(0, Math.floor(Number(patch.amount || 0)))
        if (patch.ticker !== undefined) update.ticker = normalizeTicker(patch.ticker)
        if (patch.quantity !== undefined) update.quantity = Math.max(0, Number(patch.quantity || 0))
        if (patch.avg_cost !== undefined) update.avg_cost = sanitizePrice(patch.avg_cost)
        if (patch.take_profit_price !== undefined) update.take_profit_price = sanitizePrice(patch.take_profit_price)
        if (patch.notify_take_profit !== undefined) update.notify_take_profit = Boolean(patch.notify_take_profit)
        if (patch.last_notified_at !== undefined) update.last_notified_at = patch.last_notified_at

        const { error } = await supabase
            .from('investment_assets')
            .update(update)
            .eq('id', id)

        if (error) throw error

        const idx = investments.value.findIndex((a) => a.id === id)
        if (idx !== -1) {
            investments.value[idx] = { ...investments.value[idx], ...update } as InvestmentAsset
        }
    }

    async function deleteInvestment(id: string) {
        const { error } = await supabase
            .from('investment_assets')
            .delete()
            .eq('id', id)

        if (error) throw error
        investments.value = investments.value.filter((a) => a.id !== id)
    }

    watch(() => householdId(), () => void fetchInvestments(), { immediate: true })

    return {
        investments,
        totalInvestments,
        loading,
        quoteLoading,
        quoteErrors,
        quotesByTicker,
        getCurrentAmount,
        getTakeProfitHit,
        refreshQuotes,
        requestNotificationPermission,
        fetchInvestments,
        addInvestment,
        updateInvestment,
        deleteInvestment,
    }
}
