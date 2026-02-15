import { reactive } from 'vue';
export const sessionStore = reactive({
    session: null,
    user: null,
    initialized: false,
});
