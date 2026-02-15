import { ref, watch } from 'vue';
import { supabase } from '@/lib/supabase';
export function useBudgets(householdId) {
    const budgets = ref([]);
    const loading = ref(false);
    async function fetchBudgets(periodStart) {
        const hid = householdId();
        if (!hid)
            return;
        loading.value = true;
        let query = supabase
            .from('budgets')
            .select('id, household_id, category_id, period, period_start, amount')
            .eq('household_id', hid)
            .eq('period', 'monthly')
            .order('period_start', { ascending: false });
        if (periodStart) {
            query = query.eq('period_start', periodStart);
        }
        const { data, error } = await query;
        loading.value = false;
        if (error)
            throw error;
        budgets.value = (data ?? []);
    }
    async function upsertBudget(payload) {
        const { error } = await supabase.from('budgets').upsert(payload, {
            onConflict: 'household_id,category_id,period,period_start',
        });
        if (error)
            throw error;
        await fetchBudgets(payload.period_start);
    }
    async function deleteBudget(id) {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if (error)
            throw error;
        budgets.value = budgets.value.filter((b) => b.id !== id);
    }
    watch(() => householdId(), () => void fetchBudgets(), { immediate: true });
    return {
        budgets,
        loading,
        fetchBudgets,
        upsertBudget,
        deleteBudget,
    };
}
