import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type { BankAccount } from '@/types/db'

export function useAccounts(householdId: () => string | null) {
    const accounts = ref<BankAccount[]>([])
    const loading = ref(false)

    const totalBalance = computed(() =>
        accounts.value.reduce((sum, a) => sum + a.balance, 0),
    )

    async function fetchAccounts() {
        const hid = householdId()
        if (!hid) {
            accounts.value = []
            return
        }

        loading.value = true
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('id, household_id, institution_name, balance, sort_order')
            .eq('household_id', hid)
            .order('sort_order', { ascending: true })

        loading.value = false
        if (error) throw error

        accounts.value = (data ?? []) as BankAccount[]
    }

    async function addAccount(institutionName: string, balance: number) {
        const hid = householdId()
        if (!hid) {
            throw new Error('家計グループが未選択です。再ログイン後にお試しください。')
        }

        const safeBalance = Math.max(0, Math.floor(Number(balance || 0)))
        const nextOrder = accounts.value.length > 0
            ? Math.max(...accounts.value.map((a) => a.sort_order)) + 10
            : 10

        const { data, error } = await supabase
            .from('bank_accounts')
            .insert({
                household_id: hid,
                institution_name: institutionName.trim(),
                balance: safeBalance,
                sort_order: nextOrder,
            })
            .select()
            .single()

        if (error) throw error
        accounts.value.push(data as BankAccount)
    }

    async function updateAccount(id: string, patch: Partial<Pick<BankAccount, 'institution_name' | 'balance'>>) {
        const hid = householdId()
        if (!hid) {
            throw new Error('家計グループが未選択です。再ログイン後にお試しください。')
        }

        const update: Record<string, unknown> = {}
        if (patch.institution_name !== undefined) update.institution_name = patch.institution_name.trim()
        if (patch.balance !== undefined) update.balance = Math.max(0, Math.floor(Number(patch.balance || 0)))

        const { error } = await supabase
            .from('bank_accounts')
            .update(update)
            .eq('id', id)
            .eq('household_id', hid)

        if (error) throw error

        const idx = accounts.value.findIndex((a) => a.id === id)
        if (idx !== -1) {
            accounts.value[idx] = { ...accounts.value[idx], ...update } as BankAccount
        }
    }

    async function deleteAccount(id: string) {
        const hid = householdId()
        if (!hid) {
            throw new Error('家計グループが未選択です。再ログイン後にお試しください。')
        }

        const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', id)
            .eq('household_id', hid)

        if (error) throw error
        accounts.value = accounts.value.filter((a) => a.id !== id)
    }

    watch(() => householdId(), () => void fetchAccounts(), { immediate: true })

    return {
        accounts,
        totalBalance,
        loading,
        fetchAccounts,
        addAccount,
        updateAccount,
        deleteAccount,
    }
}
