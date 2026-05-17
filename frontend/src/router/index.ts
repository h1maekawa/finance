import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import LandingView from '@/views/LandingView.vue'
import LoginView from '@/views/LoginView.vue'
import HomeView from '@/views/HomeView.vue'
import HistoryView from '@/views/HistoryView.vue'
import EntryView from '@/views/EntryView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: LandingView, meta: { public: true } },
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/home', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/history', name: 'history', component: HistoryView, meta: { requiresAuth: true } },
    { path: '/entry', name: 'entry', component: EntryView, meta: { requiresAuth: true } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to, _from, next) => {
  const { user, loading } = useAuth()

  const waitForAuth = () => {
    if (loading.value) {
      setTimeout(waitForAuth, 50)
      return
    }
    if (to.meta.requiresAuth && !user.value) {
      next('/login')
    } else if (to.meta.public && user.value) {
      next('/home')
    } else {
      next()
    }
  }
  waitForAuth()
})

export default router
