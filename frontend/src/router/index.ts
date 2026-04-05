import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/LandingView.vue'
import DashboardView from '@/views/DashboardView.vue'
import HomeView from '@/views/HomeView.vue'
import BalancesView from '@/views/BalancesView.vue'
import HistoryView from '@/views/HistoryView.vue'
import AnalysisView from '@/views/AnalysisView.vue'
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
import TransactionEntryView from '@/views/TransactionEntryView.vue'
import ReportsView from '@/views/ReportsView.vue'
import BudgetSettingsView from '@/views/BudgetSettingsView.vue'
import { sessionStore } from '@/stores/session'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: LandingView, meta: { publicPage: true } },
    { path: '/login', component: LoginView, meta: { publicPage: true, authOnly: true } },
    { path: '/signup', component: SignupView, meta: { publicPage: true, authOnly: true } },
    // new homes
    { path: '/home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/balances', component: BalancesView, meta: { requiresAuth: true } },
    { path: '/history', component: HistoryView, meta: { requiresAuth: true } },
    { path: '/analysis', component: AnalysisView, meta: { requiresAuth: true } },
    // legacy / existing
    { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/entry', component: TransactionEntryView, meta: { requiresAuth: true } },
    { path: '/reports', component: ReportsView, meta: { requiresAuth: true } },
    { path: '/budgets', component: BudgetSettingsView, meta: { requiresAuth: true } },
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
