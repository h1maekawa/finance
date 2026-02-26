import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type { InvestmentAsset } from '@/types/db'

export const ASSET_TYPES = ['投資信託', '個別株', 'ETF', 'その他'] as const

export function useInvestments(householdId: () => string | null) {
    const investments = ref<InvestmentAsset[]>([])
    const loading = ref(false)

    const totalInvestments = computed(() =>
        investments.value.reduce((sum, a) => sum + a.amount, 0),
    )

    async function fetchInvestments() {
        const hid = householdId()
        if (!hid) {
            investments.value = []
            return
        }

        loading.value = true
        const { data, error } = await supabase
            .from('investment_assets')
            .select('id, household_id, asset_type, name, amount, sort_order')
            .eq('household_id', hid)
            .order('sort_order', { ascending: true })

        loading.value = false
        if (error) throw error

        investments.value = (data ?? []) as InvestmentAsset[]
    }

    async function addInvestment(assetType: string, name: string, amount: number) {
        const hid = householdId()
        if (!hid) return

        const safeAmount = Math.max(0, Math.floor(Number(amount || 0)))
        const nextOrder = investments.value.length > 0
            ? Math.max(...investments.value.map((a) => a.sort_order)) + 10
            : 10

        const { data, error } = await supabase
            .from('investment_assets')
            .insert({
                household_id: hid,
                asset_type: assetType,
                name: name.trim(),
                amount: safeAmount,
                sort_order: nextOrder,
            })
            .select()
            .single()

        if (error) throw error
        investments.value.push(data as InvestmentAsset)
    }

    async function updateInvestment(id: string, patch: Partial<Pick<InvestmentAsset, 'asset_type' | 'name' | 'amount'>>) {
        const update: Record<string, unknown> = {}
        if (patch.asset_type !== undefined) update.asset_type = patch.asset_type
        if (patch.name !== undefined) update.name = patch.name.trim()
        if (patch.amount !== undefined) update.amount = Math.max(0, Math.floor(Number(patch.amount || 0)))

        const { error } = await supabase
            .from('investment_assets')
            .update(update)
            .eq('id', id)

        if (error) throw error

        const idx = investments.value.findIndex((a) => a.id === id)
        if (idx !== -1) {
            investments.value[idx] = { ...investments.value[idx], ...update } as InvestmentAsset
        }
    }

    async function deleteInvestment(id: string) {
        const { error } = await supabase
            .from('investment_assets')
            .delete()
            .eq('id', id)

        if (error) throw error
        investments.value = investments.value.filter((a) => a.id !== id)
    }

    watch(() => householdId(), () => void fetchInvestments(), { immediate: true })

    return {
        investments,
        totalInvestments,
        loading,
        fetchInvestments,
        addInvestment,
        updateInvestment,
        deleteInvestment,
    }
}
