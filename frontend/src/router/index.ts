import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import GoalView from '@/views/GoalView.vue'
import CashflowView from '@/views/CashflowView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import AssetsView from '@/views/AssetsView.vue'
import AccountsView from '@/views/AccountsView.vue'
import StocksView from '@/views/StocksView.vue'
import RegisterView from '@/views/RegisterView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LoginView from '@/views/LoginView.vue'
import GmailImportView from '@/views/GmailImportView.vue'
import { sessionStore } from '@/stores/session'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView },
    { path: '/', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/goal', component: GoalView, meta: { requiresAuth: true } },
    { path: '/accounts', component: AccountsView, meta: { requiresAuth: true } },
    { path: '/investments', component: StocksView, meta: { requiresAuth: true } },
    { path: '/cashflow', component: CashflowView, meta: { requiresAuth: true } },
    { path: '/gmail-import', component: GmailImportView, meta: { requiresAuth: true } },
    { path: '/income', redirect: '/cashflow' },
    { path: '/expense', redirect: '/cashflow' },
    { path: '/register', component: RegisterView, meta: { requiresAuth: true } },
    { path: '/assets', component: AssetsView, meta: { requiresAuth: true } },
    { path: '/settings', component: SettingsView, meta: { requiresAuth: true } },
    { path: '/categories', component: CategoriesView, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !sessionStore.user) {
    return '/login'
  }
  if (to.path === '/login' && sessionStore.user) {
    return '/'
  }
  return true
})

export default router
