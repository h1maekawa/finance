import { onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { sessionStore } from '@/stores/session'

let subscribed = false

export function useAuth() {
  const loading = ref(false)

  async function initAuth() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error

    sessionStore.session = data.session
    sessionStore.user = data.session?.user ?? null
    sessionStore.initialized = true

    if (!subscribed) {
      supabase.auth.onAuthStateChange((_event, session) => {
        sessionStore.session = session
        sessionStore.user = session?.user ?? null
        sessionStore.initialized = true
      })
      subscribed = true
    }
  }

  async function signUp(email: string, password: string, name?: string) {
    loading.value = true
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    loading.value = false
    if (error) throw error
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    loading.value = false
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  onMounted(() => {
    if (!sessionStore.initialized) {
      void initAuth()
    }
  })

  return {
    loading,
    sessionStore,
    signUp,
    signIn,
    signOut,
    initAuth,
  }
}
