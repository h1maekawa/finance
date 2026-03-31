import { onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { sessionStore } from '@/stores/session'
import type { AuthUser } from '@/stores/session'

let subscribed = false

function mapSupabaseUserToAuthUser(user: any): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  }
}

export function useAuth() {
  const loading = ref(false)

  function initAuth(): Promise<void> {
    if (subscribed) {
      return Promise.resolve()
    }
    subscribed = true

    return new Promise((resolve) => {
      // 現在のセッションを確認
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          sessionStore.user = mapSupabaseUserToAuthUser(session.user)
          saveGmailTokenFromSession(session)
        }
        sessionStore.initialized = true
        resolve()
      })

      // 認証状態の変化を監視
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          sessionStore.user = mapSupabaseUserToAuthUser(session.user)
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await saveGmailTokenFromSession(session)
          }
        } else {
          sessionStore.user = null
        }
        sessionStore.initialized = true
      })
    })
  }

  async function saveGmailTokenFromSession(session: any) {
    const { provider_token, provider_refresh_token, user } = session
    if (!provider_token) return

    try {
      // Supabase Auth の Google 連携で取得したトークンを gmail_tokens テーブルに保存
      await supabase.from('gmail_tokens').upsert({
        user_id: user.id,
        access_token: provider_token,
        refresh_token: provider_refresh_token ?? null, // 既存があれば維持、新規があれば更新
        token_type: 'google',
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
      }, { onConflict: 'user_id' })
    } catch (dbError) {
      console.error('Failed to save gmail token from session:', dbError)
    }
  }

  async function signInWithGoogle() {
    loading.value = true
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        },
      })
      if (error) throw error
    } catch (authError) {
      console.error('Failed to sign in with Google:', authError)
    } finally {
      // OAuth はリダイレクトが走るため、loading は基本的にそのまま
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error)
    sessionStore.user = null
  }

  onMounted(() => {
    if (!sessionStore.initialized) {
      initAuth()
    }
  })

  return {
    loading,
    sessionStore,
    signInWithGoogle,
    signOut,
    initAuth,
  }
}
