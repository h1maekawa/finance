import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import IncomeView from '@/views/IncomeView.vue'
import ExpenseView from '@/views/ExpenseView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import AssetsView from '@/views/AssetsView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/income', component: IncomeView },
    { path: '/expense', component: ExpenseView },
    { path: '/transactions', component: TransactionsView },
    { path: '/assets', component: AssetsView },
    { path: '/settings', component: SettingsView },
    { path: '/categories', component: CategoriesView },
  ],
})

export default router
