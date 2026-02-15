import { computed } from 'vue';
import ExpensePieChart from '@/components/charts/ExpensePieChart.vue';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart.vue';
import { useHousehold } from '@/composables/useHousehold';
import { useTransactions } from '@/composables/useTransactions';
import { useMonthlySummary } from '@/composables/useMonthlySummary';
import { useCategories } from '@/composables/useCategories';
const { currentHouseholdId } = useHousehold();
const { transactions, selectedMonth, totalIncome, totalExpense, balance, } = useTransactions(() => currentHouseholdId.value);
const { categories } = useCategories(() => currentHouseholdId.value);
const summary = useMonthlySummary(() => transactions.value, (categoryId) => categories.value.find((c) => c.id === categoryId)?.name ?? '未分類');
const monthInput = computed({
    get: () => selectedMonth.value.toISOString().slice(0, 7),
    set: (value) => {
        selectedMonth.value = new Date(`${value}-01T00:00:00`);
    },
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "row" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card row" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "month",
});
(__VLS_ctx.monthInput);
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "card" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.totalIncome.toLocaleString());
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "card" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.totalExpense.toLocaleString());
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "card" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.balance.toLocaleString());
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "row" },
});
/** @type {[typeof ExpensePieChart, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(ExpensePieChart, new ExpensePieChart({
    chartData: (__VLS_ctx.summary.pieData.value),
}));
const __VLS_1 = __VLS_0({
    chartData: (__VLS_ctx.summary.pieData.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {[typeof MonthlyBarChart, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(MonthlyBarChart, new MonthlyBarChart({
    chartData: (__VLS_ctx.summary.barData.value),
}));
const __VLS_4 = __VLS_3({
    chartData: (__VLS_ctx.summary.barData.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ExpensePieChart: ExpensePieChart,
            MonthlyBarChart: MonthlyBarChart,
            totalIncome: totalIncome,
            totalExpense: totalExpense,
            balance: balance,
            summary: summary,
            monthInput: monthInput,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
