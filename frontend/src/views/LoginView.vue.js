import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
const email = ref('');
const password = ref('');
const name = ref('');
const mode = ref('login');
const errorMessage = ref('');
const router = useRouter();
const { signIn, signUp, loading } = useAuth();
async function submit() {
    errorMessage.value = '';
    try {
        if (mode.value === 'login') {
            await signIn(email.value, password.value);
        }
        else {
            await signUp(email.value, password.value, name.value);
            await signIn(email.value, password.value);
        }
        await router.push('/');
    }
    catch (error) {
        errorMessage.value = error instanceof Error ? error.message : '認証に失敗しました';
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "card" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
(__VLS_ctx.mode === 'login' ? 'ログイン' : '新規登録');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row" },
    ...{ style: {} },
});
if (__VLS_ctx.mode === 'signup') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "表示名",
    });
    (__VLS_ctx.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Email",
    type: "email",
});
(__VLS_ctx.email);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Password",
    type: "password",
});
(__VLS_ctx.password);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.submit) },
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.mode === 'login' ? 'ログイン' : '登録');
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.mode = __VLS_ctx.mode === 'login' ? 'signup' : 'login';
        } },
    href: "#",
});
(__VLS_ctx.mode === 'login' ? '新規登録へ' : 'ログインへ');
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: {} },
    });
    (__VLS_ctx.errorMessage);
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            email: email,
            password: password,
            name: name,
            mode: mode,
            errorMessage: errorMessage,
            loading: loading,
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
