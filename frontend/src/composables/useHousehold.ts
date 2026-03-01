import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Household } from '@/types/db'

const households = ref<Household[]>([])
const rawDevHouseholdId = import.meta.env.VITE_DEV_HOUSEHOLD_ID as string | undefined
const devHouseholdId = rawDevHouseholdId && !rawDevHouseholdId.startsWith('YOUR_')
  ? rawDevHouseholdId
  : undefined
const currentHouseholdId = ref<string | null>(devHouseholdId ?? null)

export function useHousehold() {
  const currentHousehold = computed(() =>
    households.value.find((h) => h.id === currentHouseholdId.value) ?? null,
  )

  async function fetchHouseholds() {
    const { data, error } = await supabase
      .from('households')
      .select('id, name, owner_user_id')
      .order('created_at', { ascending: true })

    if (error) {
      if (devHouseholdId) return
      throw error
    }

    households.value = (data ?? []) as Household[]
    if (!currentHouseholdId.value && households.value.length > 0) {
      currentHouseholdId.value = households.value[0].id
    }
  }

  function setCurrentHousehold(householdId: string) {
    currentHouseholdId.value = householdId
  }

  return {
    households,
    currentHouseholdId,
    currentHousehold,
    fetchHouseholds,
    setCurrentHousehold,
  }
}
