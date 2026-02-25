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
    const { data, error } = await supabase
      .from('household_assets')
      .select('stocks, funds, cash, account')
      .eq('household_id', hid)
      .maybeSingle()

    loading.value = false
    if (error) throw error

    if (!data) {
      state.value = { ...defaults }
      return
    }

    state.value = {
      stocks: Number(data.stocks ?? 0),
      funds: Number(data.funds ?? 0),
      cash: Number(data.cash ?? 0),
      account: Number(data.account ?? 0),
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
