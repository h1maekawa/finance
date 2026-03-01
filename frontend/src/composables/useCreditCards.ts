import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type { CreditCard } from '@/types/db'

export function useCreditCards(householdId: () => string | null) {
  const creditCards = ref<CreditCard[]>([])
  const loading = ref(false)

  const activeCards = computed(() =>
    creditCards.value.filter((card) => card.is_active),
  )

  async function fetchCreditCards() {
    const hid = householdId()
    if (!hid) {
      creditCards.value = []
      return
    }

    loading.value = true
    const { data, error } = await supabase
      .from('credit_cards')
      .select('id, household_id, card_name, brand, last4, sort_order, is_active')
      .eq('household_id', hid)
      .order('sort_order', { ascending: true })
    loading.value = false

    if (error) throw error
    creditCards.value = (data ?? []) as CreditCard[]
  }

  async function addCreditCard(payload: {
    card_name: string
    brand?: string | null
    last4?: string | null
    is_active?: boolean
  }) {
    const hid = householdId()
    if (!hid) throw new Error('No household selected')

    const nextOrder = creditCards.value.length > 0
      ? Math.max(...creditCards.value.map((v) => v.sort_order)) + 10
      : 10

    const { data, error } = await supabase
      .from('credit_cards')
      .insert({
        household_id: hid,
        card_name: payload.card_name.trim(),
        brand: payload.brand?.trim() || null,
        last4: payload.last4?.trim() || null,
        is_active: payload.is_active ?? true,
        sort_order: nextOrder,
      })
      .select('id, household_id, card_name, brand, last4, sort_order, is_active')
      .single()

    if (error) throw error
    creditCards.value.push(data as CreditCard)
  }

  watch(() => householdId(), () => void fetchCreditCards(), { immediate: true })

  return {
    creditCards,
    activeCards,
    loading,
    fetchCreditCards,
    addCreditCard,
  }
}
