import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'

type AssetBreakdown = {
  stocks: number
  funds: number
  cash: number
  account: number
}

const defaults: AssetBreakdown = {
  stocks: 0,
  funds: 0,
  cash: 0,
  account: 0,
}

export function useAssetBreakdown(householdId: () => string | null) {
  const state = ref<AssetBreakdown>({ ...defaults })
  const loading = ref(false)

  const totalAssets = computed(() =>
    state.value.stocks + state.value.funds + state.value.cash + state.value.account,
  )

  async function fetchAssets() {
    const hid = householdId()
    if (!hid) {
      state.value = { ...defaults }
      return
    }

    loading.value = true
    
    // Fetch manual breakdown
    const { data: assetData, error: assetError } = await supabase
      .from('household_assets')
      .select('stocks, funds, cash, account')
      .eq('household_id', hid)
      .maybeSingle()

    if (assetError) throw assetError

    // Fetch automated totals from investments
    const { data: invData, error: invError } = await supabase
        .from('investments')
        .select('type, evaluation_amount')
        .eq('user_id', hid) // Assuming household_id maps to user_id here or we use session

    if (invError) throw invError

    const autoStocks = invData
        ?.filter(i => i.type !== 'fund')
        .reduce((sum, i) => sum + (Number(i.evaluation_amount) || 0), 0) || 0
    
    const autoFunds = invData
        ?.filter(i => i.type === 'fund')
        .reduce((sum, i) => sum + (Number(i.evaluation_amount) || 0), 0) || 0

    loading.value = false

    state.value = {
      stocks: autoStocks,
      funds: autoFunds,
      cash: Number(assetData?.cash ?? 0),
      account: Number(assetData?.account ?? 0),
    }
  }

  async function update(patch: Partial<AssetBreakdown>) {
    const hid = householdId()
    if (!hid) return

    const next = { ...state.value, ...patch }
    const sanitized: AssetBreakdown = {
      stocks: Math.max(0, Number(next.stocks || 0)),
      funds: Math.max(0, Number(next.funds || 0)),
      cash: Math.max(0, Number(next.cash || 0)),
      account: Math.max(0, Number(next.account || 0)),
    }

    const { error } = await supabase.from('household_assets').upsert({
      household_id: hid,
      ...sanitized,
    })
    if (error) throw error

    state.value = sanitized
  }

  watch(() => householdId(), () => void fetchAssets(), { immediate: true })

  return {
    state,
    totalAssets,
    loading,
    fetchAssets,
    update,
  }
}
