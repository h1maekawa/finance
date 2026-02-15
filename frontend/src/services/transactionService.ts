import { supabase } from '@/lib/supabase'

export async function fetchMonthlyTransactions(householdId: string, start: string, end: string) {
  return supabase
    .from('transactions')
    .select('id, household_id, user_id, category_id, kind, amount, transaction_date, note')
    .eq('household_id', householdId)
    .gte('transaction_date', start)
    .lt('transaction_date', end)
    .order('transaction_date', { ascending: false })
}
