import { computed, onMounted, watch } from 'vue';
import { RouterView } from 'vue-router';
import AppHeader from '@/components/layouts/AppHeader.vue';
import { useAuth } from '@/composables/useAuth';
import { useHousehold } from '@/composables/useHousehold';
const { sessionStore, initAuth } = useAuth();
const { fetchHouseholds } = useHousehold();
const loggedIn = computed(() => !!sessionStore.user);
onMounted(async () => {
    await initAuth();
    if (sessionStore.user) {
        await fetchHouseholds();
    }
});
watch(() => sessionStore.user?.id, async (userId) => {
    if (userId) {
        await fetchHouseholds();
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "container" },
});
if (__VLS_ctx.loggedIn) {
    /** @type {[typeof AppHeader, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(AppHeader, new AppHeader({}));
    const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
const __VLS_3 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({}));
const __VLS_5 = __VLS_4({}, ...__VLS_functionalComponentArgsRest(__VLS_4));
/** @type {__VLS_StyleScopedClasses['container']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            RouterView: RouterView,
            AppHeader: AppHeader,
            loggedIn: loggedIn,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
