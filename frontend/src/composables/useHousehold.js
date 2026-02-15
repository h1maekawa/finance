import { computed, ref } from 'vue';
import { supabase } from '@/lib/supabase';
const households = ref([]);
const currentHouseholdId = ref(null);
export function useHousehold() {
    const currentHousehold = computed(() => households.value.find((h) => h.id === currentHouseholdId.value) ?? null);
    async function fetchHouseholds() {
        const { data, error } = await supabase
            .from('households')
            .select('id, name, owner_user_id')
            .order('created_at', { ascending: true });
        if (error)
            throw error;
        households.value = (data ?? []);
        if (!currentHouseholdId.value && households.value.length > 0) {
            currentHouseholdId.value = households.value[0].id;
        }
    }
    function setCurrentHousehold(householdId) {
        currentHouseholdId.value = householdId;
    }
    return {
        households,
        currentHouseholdId,
        currentHousehold,
        fetchHouseholds,
        setCurrentHousehold,
    };
}
