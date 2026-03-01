import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type { SecuritiesAccount } from '@/types/db'

export function useSecuritiesAccounts(householdId: () => string | null) {
  const securitiesAccounts = ref<SecuritiesAccount[]>([])
  const loading = ref(false)

  const activeSecuritiesAccounts = computed(() =>
    securitiesAccounts.value.filter((v) => v.is_active),
  )

  async function fetchSecuritiesAccounts() {
    const hid = householdId()
    if (!hid) {
      securitiesAccounts.value = []
      return
    }

    loading.value = true
    const { data, error } = await supabase
      .from('securities_accounts')
      .select('id, household_id, broker_name, account_name, tax_category, is_active, sort_order')
      .eq('household_id', hid)
      .order('sort_order', { ascending: true })
    loading.value = false

    if (error) throw error
    securitiesAccounts.value = (data ?? []) as SecuritiesAccount[]
  }

  async function addSecuritiesAccount(payload: {
    broker_name: string
    account_name: string
    tax_category: SecuritiesAccount['tax_category']
    is_active?: boolean
  }) {
    const hid = householdId()
    if (!hid) throw new Error('No household selected')

    const nextOrder = securitiesAccounts.value.length > 0
      ? Math.max(...securitiesAccounts.value.map((v) => v.sort_order)) + 10
      : 10

    const { data, error } = await supabase
      .from('securities_accounts')
      .insert({
        household_id: hid,
        broker_name: payload.broker_name.trim(),
        account_name: payload.account_name.trim(),
        tax_category: payload.tax_category,
        is_active: payload.is_active ?? true,
        sort_order: nextOrder,
      })
      .select('id, household_id, broker_name, account_name, tax_category, is_active, sort_order')
      .single()

    if (error) throw error
    securitiesAccounts.value.push(data as SecuritiesAccount)
  }

  async function updateSecuritiesAccount(
    id: string,
    patch: Partial<Pick<SecuritiesAccount, 'broker_name' | 'account_name' | 'tax_category' | 'is_active'>>,
  ) {
    const hid = householdId()
    if (!hid) throw new Error('No household selected')

    const update: Record<string, unknown> = {}
    if (patch.broker_name !== undefined) update.broker_name = patch.broker_name.trim()
    if (patch.account_name !== undefined) update.account_name = patch.account_name.trim()
    if (patch.tax_category !== undefined) update.tax_category = patch.tax_category
    if (patch.is_active !== undefined) update.is_active = patch.is_active

    const { error } = await supabase
      .from('securities_accounts')
      .update(update)
      .eq('id', id)
      .eq('household_id', hid)
    if (error) throw error

    const idx = securitiesAccounts.value.findIndex((v) => v.id === id)
    if (idx !== -1) {
      securitiesAccounts.value[idx] = { ...securitiesAccounts.value[idx], ...update } as SecuritiesAccount
    }
  }

  async function deleteSecuritiesAccount(id: string) {
    const hid = householdId()
    if (!hid) throw new Error('No household selected')

    const { error } = await supabase
      .from('securities_accounts')
      .delete()
      .eq('id', id)
      .eq('household_id', hid)
    if (error) throw error

    securitiesAccounts.value = securitiesAccounts.value.filter((v) => v.id !== id)
  }

  watch(() => householdId(), () => void fetchSecuritiesAccounts(), { immediate: true })

  return {
    securitiesAccounts,
    activeSecuritiesAccounts,
    loading,
    fetchSecuritiesAccounts,
    addSecuritiesAccount,
    updateSecuritiesAccount,
    deleteSecuritiesAccount,
  }
}
