import { onMounted, ref } from 'vue'
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { firebaseAuth, googleProvider } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'
import { sessionStore } from '@/stores/session'

let subscribed = false

function syncUser() {
  const u = firebaseAuth.currentUser
  sessionStore.user = u
    ? {
        id: u.uid,
        email: u.email,
        displayName: u.displayName,
      }
    : null
}

async function ensureProfile() {
  const u = firebaseAuth.currentUser
  if (!u) return

  const { error } = await supabase.from('profiles').upsert({
    id: u.uid,
    display_name: u.displayName ?? (u.email ? u.email.split('@')[0] : null),
  })

  if (error) {
    throw error
  }
}

export function useAuth() {
  const loading = ref(false)

  async function initAuth() {
    try {
      await getRedirectResult(firebaseAuth)
    } catch (error) {
      console.error('Failed to resolve redirect auth result:', error)
    }

    if (!subscribed) {
      await new Promise<void>((resolve) => {
        onAuthStateChanged(firebaseAuth, () => {
          syncUser()
          sessionStore.initialized = true
          void ensureProfile().catch((error) => {
            console.error('Failed to upsert profile after auth init:', error)
          })
          resolve()
        })
      })

      onAuthStateChanged(firebaseAuth, () => {
        syncUser()
        sessionStore.initialized = true
        void ensureProfile().catch((error) => {
          console.error('Failed to upsert profile after auth state change:', error)
        })
      })

      subscribed = true
      return
    }

    syncUser()
    sessionStore.initialized = true
    await ensureProfile()
  }

  async function signUpWithEmail(email: string, password: string, displayName?: string) {
    loading.value = true
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
      if (displayName) {
        await updateProfile(credential.user, { displayName })
      }
    } finally {
      loading.value = false
    }
  }

  async function signInWithEmail(email: string, password: string) {
    loading.value = true
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password)
    } finally {
      loading.value = false
    }
  }

  async function signInWithGoogle() {
    loading.value = true
    try {
      await signInWithPopup(firebaseAuth, googleProvider)
    } catch (error) {
      const code =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code?: unknown }).code === 'string'
          ? (error as { code: string }).code
          : ''

      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(firebaseAuth, googleProvider)
        return
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    await firebaseSignOut(firebaseAuth)
  }

  onMounted(() => {
    if (!sessionStore.initialized) {
      void initAuth()
    }
  })

  return {
    loading,
    sessionStore,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    initAuth,
  }
}
