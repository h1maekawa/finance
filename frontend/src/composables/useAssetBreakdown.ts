import { computed, ref } from 'vue'

const STORAGE_KEY = 'asset_breakdown_v1'

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

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<AssetBreakdown>
    return {
      stocks: Number(parsed.stocks ?? 0),
      funds: Number(parsed.funds ?? 0),
      cash: Number(parsed.cash ?? 0),
      account: Number(parsed.account ?? 0),
    }
  } catch {
    return defaults
  }
}

const state = ref<AssetBreakdown>(load())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
}

export function useAssetBreakdown() {
  const totalAssets = computed(() =>
    state.value.stocks + state.value.funds + state.value.cash + state.value.account,
  )

  function update(patch: Partial<AssetBreakdown>) {
    state.value = { ...state.value, ...patch }
    persist()
  }

  return {
    state,
    totalAssets,
    update,
  }
}
