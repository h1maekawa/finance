import { computed, ref, watch } from 'vue';
import { supabase } from '@/lib/supabase';
export function useCategories(householdId) {
    const categories = ref([]);
    const loading = ref(false);
    const incomeCategories = computed(() => categories.value.filter((c) => c.kind === 'income'));
    const expenseCategories = computed(() => categories.value.filter((c) => c.kind === 'expense'));
    async function fetchCategories() {
        const hid = householdId();
        if (!hid)
            return;
        loading.value = true;
        const { data, error } = await supabase
            .from('categories')
            .select('id, household_id, name, kind, color, icon, sort_order')
            .eq('household_id', hid)
            .order('sort_order', { ascending: true });
        loading.value = false;
        if (error)
            throw error;
        categories.value = (data ?? []);
    }
    async function createCategory(payload) {
        const hid = householdId();
        if (!hid)
            throw new Error('No household selected');
        const { error } = await supabase.from('categories').insert({
            household_id: hid,
            ...payload,
        });
        if (error)
            throw error;
        await fetchCategories();
    }
    async function updateCategory(id, patch) {
        const { error } = await supabase.from('categories').update(patch).eq('id', id);
        if (error)
            throw error;
        await fetchCategories();
    }
    async function deleteCategory(id) {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error)
            throw error;
        categories.value = categories.value.filter((c) => c.id !== id);
    }
    watch(() => householdId(), fetchCategories, { immediate: true });
    return {
        categories,
        incomeCategories,
        expenseCategories,
        loading,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    };
}
