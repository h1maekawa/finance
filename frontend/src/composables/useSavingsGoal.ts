import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'

const DEFAULT_TARGET = 13_000_000
const DEFAULT_YEAR = 2030

export function useSavingsGoal(householdId: () => string | null, currentAssets: () => number) {
  const targetAmountRef = ref(DEFAULT_TARGET)
  const targetYearRef = ref(DEFAULT_YEAR)
  const loading = ref(false)

  async function fetchGoal() {
    const hid = householdId()
    if (!hid) {
      targetAmountRef.value = DEFAULT_TARGET
      targetYearRef.value = DEFAULT_YEAR
      return
    }

    loading.value = true
    const { data, error } = await supabase
      .from('household_settings')
      .select('target_amount, target_year')
      .eq('household_id', hid)
      .maybeSingle()

    loading.value = false
    if (error) throw error

    if (!data) {
      targetAmountRef.value = DEFAULT_TARGET
      targetYearRef.value = DEFAULT_YEAR
      return
    }

    targetAmountRef.value = Number(data.target_amount ?? DEFAULT_TARGET)
    targetYearRef.value = Number(data.target_year ?? DEFAULT_YEAR)
  }

  async function setTarget(amount: number) {
    const hid = householdId()
    if (!hid) return

    const safeAmount = Math.max(0, Number(amount || 0))
    const { error } = await supabase.from('household_settings').upsert({
      household_id: hid,
      target_amount: safeAmount,
      target_year: targetYearRef.value,
    })
    if (error) throw error

    targetAmountRef.value = safeAmount
  }

  async function setTargetYear(year: number) {
    const hid = householdId()
    if (!hid) return

    const safeYear = Math.min(2100, Math.max(2025, Number(year || DEFAULT_YEAR)))
    const { error } = await supabase.from('household_settings').upsert({
      household_id: hid,
      target_amount: targetAmountRef.value,
      target_year: safeYear,
    })
    if (error) throw error

    targetYearRef.value = safeYear
  }

  const remainingNeeded = computed(() =>
    Math.max(0, targetAmountRef.value - currentAssets()),
  )

  const achievementRate = computed(() =>
    targetAmountRef.value <= 0
      ? 0
      : Math.min(100, (currentAssets() / targetAmountRef.value) * 100),
  )

  const monthsRemaining = computed(() => {
    const now = new Date()
    const end = new Date(targetYearRef.value, 11, 31)
    if (end <= now) return 0

    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    let months = 0
    const cur = new Date(start)

    while (cur <= end) {
      months++
      cur.setMonth(cur.getMonth() + 1)
    }

    return months
  })

  const monthlySavingsNeeded = computed(() =>
    monthsRemaining.value <= 0
      ? 0
      : Math.ceil(remainingNeeded.value / monthsRemaining.value),
  )

  watch(() => householdId(), () => void fetchGoal(), { immediate: true })

  return {
    targetAmount: targetAmountRef,
    targetYear: targetYearRef,
    setTarget,
    setTargetYear,
    remainingNeeded,
    achievementRate,
    monthsRemaining,
    monthlySavingsNeeded,
    loading,
    fetchGoal,
  }
}
