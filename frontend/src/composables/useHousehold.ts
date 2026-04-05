import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { firebaseAuth } from '@/lib/firebase'
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
    
    if (households.value.length === 0) {
      const user = firebaseAuth.currentUser
      if (!user) return

      const { data: newHousehold } = await supabase
        .from('households')
        .insert({ 
          name: 'マイ家計',
          owner_user_id: user.uid 
        })
        .select()
        .single()

      if (newHousehold) {
        await supabase
          .from('household_members')
          .insert({ 
            household_id: newHousehold.id,
            user_id: user.uid,
            role: 'owner'
          })
        
        households.value = [newHousehold as Household]
        currentHouseholdId.value = newHousehold.id
      }
    } else if (!currentHouseholdId.value && households.value.length > 0) {
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
