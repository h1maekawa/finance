import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type { MonthlySnapshot } from '@/types/db'

export function useMonthlySnapshots(householdId: () => string | null) {
  const snapshots = ref<MonthlySnapshot[]>([])
  const loading = ref(false)

  async function fetchSnapshots() {
    const hid = householdId()
    if (!hid) {
      snapshots.value = []
      return
    }

    loading.value = true
    const { data, error } = await supabase
      .from('monthly_snapshots')
      .select(`
        id,
        household_id,
        target_month,
        income_total,
        expense_total,
        net_total,
        month_end_assets,
        memo,
        created_at,
        updated_at
      `)
      .eq('household_id', hid)
      .order('target_month', { ascending: false })
    loading.value = false

    if (error) throw error
    snapshots.value = (data ?? []) as MonthlySnapshot[]
  }

  async function saveSnapshot(payload: {
    target_month: string
    income_total: number
    expense_total: number
    net_total: number
    month_end_assets: number
    memo?: string | null
  }) {
    const hid = householdId()
    if (!hid) throw new Error('No household selected')

    const { error } = await supabase
      .from('monthly_snapshots')
      .upsert(
        {
          household_id: hid,
          target_month: payload.target_month,
          income_total: Math.floor(Number(payload.income_total || 0)),
          expense_total: Math.floor(Number(payload.expense_total || 0)),
          net_total: Math.floor(Number(payload.net_total || 0)),
          month_end_assets: Math.floor(Number(payload.month_end_assets || 0)),
          memo: payload.memo ?? null,
        },
        { onConflict: 'household_id,target_month' },
      )

    if (error) throw error
    await fetchSnapshots()
  }

  watch(() => householdId(), () => void fetchSnapshots(), { immediate: true })

  return {
    snapshots,
    loading,
    fetchSnapshots,
    saveSnapshot,
  }
}
