import { supabase } from '@/lib/supabase'

export async function fetchCategoriesByHousehold(householdId: string) {
  return supabase
    .from('categories')
    .select('id, household_id, name, kind, color, icon, sort_order')
    .eq('household_id', householdId)
    .order('sort_order', { ascending: true })
}
