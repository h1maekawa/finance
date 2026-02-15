import { computed, ref } from 'vue';
import { sessionStore } from '@/stores/session';
import { useHousehold } from '@/composables/useHousehold';
import { useTransactions } from '@/composables/useTransactions';
import { useCategories } from '@/composables/useCategories';
const { currentHouseholdId } = useHousehold();
const { transactions, selectedMonth, createTransaction, updateTransaction, deleteTransaction, } = useTransactions(() => currentHouseholdId.value);
const { categories } = useCategories(() => currentHouseholdId.value);
const form = ref({
    id: '',
    category_id: '',
    kind: 'expense',
    amount: 0,
    transaction_date: new Date().toISOString().slice(0, 10),
    note: '',
});
const monthInput = computed({
    get: () => selectedMonth.value.toISOString().slice(0, 7),
    set: (value) => {
        selectedMonth.value = new Date(`${value}-01T00:00:00`);
    },
});
const selectableCategories = computed(() => categories.value.filter((c) => c.kind === form.value.kind));
function startEdit(id) {
    const target = transactions.value.find((v) => v.id === id);
    if (!target)
        return;
    form.value = {
        id: target.id,
        category_id: target.category_id,
        kind: target.kind,
        amount: target.amount,
        transaction_date: target.transaction_date,
        note: target.note ?? '',
    };
}
function resetForm() {
    form.value = {
        id: '',
        category_id: '',
        kind: 'expense',
        amount: 0,
        transaction_date: new Date().toISOString().slice(0, 10),
        note: '',
    };
}
async function submit() {
    const userId = sessionStore.user?.id;
    if (!userId)
        return;
    const payload = {
        user_id: userId,
        category_id: form.value.category_id,
        kind: form.value.kind,
        amount: Number(form.value.amount),
        transaction_date: form.value.transaction_date,
        note: form.value.note || null,
    };
    if (form.value.id) {
        await updateTransaction(form.value.id, payload);
    }
    else {
        await createTransaction(payload);
    }
    resetForm();
}
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
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.form.id ? '取引編集' : '取引登録');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.kind),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "income",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "expense",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.category_id),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [c] of __VLS_getVForSourceType((__VLS_ctx.selectableCategories))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (c.id),
        value: (c.id),
    });
    (c.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "number",
    min: "1",
    placeholder: "金額",
});
(__VLS_ctx.form.amount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "date",
});
(__VLS_ctx.form.transaction_date);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "メモ",
});
(__VLS_ctx.form.note);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.submit) },
});
(__VLS_ctx.form.id ? '更新' : '追加');
if (__VLS_ctx.form.id) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.resetForm) },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    align: "left",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    align: "left",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    align: "left",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    align: "left",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    align: "left",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    align: "left",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
for (const [t] of __VLS_getVForSourceType((__VLS_ctx.transactions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        key: (t.id),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (t.transaction_date);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (t.kind === 'income' ? '収入' : '支出');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (Number(t.amount).toLocaleString());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (__VLS_ctx.categories.find((c) => c.id === t.category_id)?.name ?? '-');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (t.note ?? '');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.startEdit(t.id);
            } },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.deleteTransaction(t.id);
            } },
    });
}
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            transactions: transactions,
            deleteTransaction: deleteTransaction,
            categories: categories,
            form: form,
            monthInput: monthInput,
            selectableCategories: selectableCategories,
            startEdit: startEdit,
            resetForm: resetForm,
            submit: submit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
