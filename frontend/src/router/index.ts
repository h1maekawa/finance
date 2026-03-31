import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/LandingView.vue'
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
import SignupView from '@/views/SignupView.vue'
import GmailImportView from '@/views/GmailImportView.vue'
import { sessionStore } from '@/stores/session'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: LandingView, meta: { publicPage: true } },
    { path: '/login', component: LoginView, meta: { publicPage: true, authOnly: true } },
    { path: '/signup', component: SignupView, meta: { publicPage: true, authOnly: true } },
    { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/goal', component: GoalView, meta: { requiresAuth: true } },
    { path: '/accounts', component: AccountsView, meta: { requiresAuth: true } },
    { path: '/investments', component: StocksView, meta: { requiresAuth: true } },
    { path: '/cashflow', component: CashflowView, meta: { requiresAuth: true } },
    { path: '/gmail-import', component: GmailImportView, meta: { requiresAuth: true } },
    { path: '/income', redirect: '/cashflow' },
    { path: '/expense', redirect: '/cashflow' },
    { path: '/setup', component: RegisterView, meta: { requiresAuth: true } },
    { path: '/register', redirect: '/setup' },
    { path: '/assets', component: AssetsView, meta: { requiresAuth: true } },
    { path: '/settings', component: SettingsView, meta: { requiresAuth: true } },
    { path: '/categories', component: CategoriesView, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !sessionStore.user) {
    return '/login'
  }
  if (to.meta.authOnly && sessionStore.user) {
    return '/dashboard'
  }
  return true
})

export default router
