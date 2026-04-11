import { onMounted, ref } from 'vue'
import { firebaseAuth } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth'
import { supabase } from '@/lib/supabase'
import { sessionStore, syncGmail } from '@/stores/session'
import type { AuthUser } from '@/stores/session'

let subscribed = false

function mapFirebaseUserToAuthUser(user: any): AuthUser {
  return {
    id: user.uid,
    email: user.email ?? null,
    name: user.displayName ?? null,
  }
}

export function useAuth() {
  const loading = ref(false)

  function initAuth(): Promise<void> {
    if (subscribed) {
      return Promise.resolve()
    }
    subscribed = true

    // Global unauthorized listener (from supabase.ts)
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', () => {
        console.log('Unauthorized event received, signing out...')
        signOut()
      })
    }

    return new Promise((resolve) => {
      // onIdTokenChanged is more robust than onAuthStateChanged for session persistence
      firebaseAuth.onIdTokenChanged(async (user: import('firebase/auth').User | null) => {
        if (user) {
          sessionStore.user = mapFirebaseUserToAuthUser(user)
        } else {
          sessionStore.user = null
        }
        sessionStore.initialized = true
        resolve()
      })
    })
  }

  async function saveGmailToken(userId: string, accessToken: string) {
    try {
      await supabase.from('gmail_tokens').upsert({
        user_id: userId,
        access_token: accessToken,
        refresh_token: null, // Depending on offline access, refresh token might not be available from popup
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
      const provider = new GoogleAuthProvider()
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly')
      provider.setCustomParameters({
        prompt: 'consent',
        access_type: 'offline'
      })

      const result = await signInWithPopup(firebaseAuth, provider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      
      if (credential?.accessToken) {
        await saveGmailToken(result.user.uid, credential.accessToken)
      }

      // Trigger Gmail sync in background after login
      syncGmail().catch(() => {})
    } catch (authError) {
      console.error('Failed to sign in with Google:', authError)
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(firebaseAuth)
      await supabase.auth.signOut() // Just in case to clear any internal supabase session
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      sessionStore.user = null
    }
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
