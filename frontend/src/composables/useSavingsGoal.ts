import { computed, ref } from 'vue'

const STORAGE_KEY_TARGET = 'savings_goal_target_amount'
const STORAGE_KEY_YEAR = 'savings_goal_target_year'
const DEFAULT_TARGET = 13_000_000
const DEFAULT_YEAR = 2030

export function useSavingsGoal(currentAssets: () => number) {
  const savedTarget = Number(localStorage.getItem(STORAGE_KEY_TARGET)) || DEFAULT_TARGET
  const savedYear = Number(localStorage.getItem(STORAGE_KEY_YEAR)) || DEFAULT_YEAR

  const targetAmountRef = ref(savedTarget)
  const targetYearRef = ref(savedYear)

  function setTarget(amount: number) {
    targetAmountRef.value = amount
    localStorage.setItem(STORAGE_KEY_TARGET, String(amount))
  }

  function setTargetYear(year: number) {
    targetYearRef.value = year
    localStorage.setItem(STORAGE_KEY_YEAR, String(year))
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

  return {
    targetAmount: targetAmountRef,
    targetYear: targetYearRef,
    setTarget,
    setTargetYear,
    remainingNeeded,
    achievementRate,
    monthsRemaining,
    monthlySavingsNeeded,
  }
}
