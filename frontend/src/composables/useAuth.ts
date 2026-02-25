import { onMounted, ref } from 'vue'
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { firebaseAuth, googleProvider } from '@/lib/firebase'
import { sessionStore } from '@/stores/session'
import type { AuthUser } from '@/stores/session'

let subscribed = false

function mapFirebaseUserToAuthUser(uid: string, email?: string | null): AuthUser {
  return { id: uid, email: email ?? null }
}

export function useAuth() {
  const loading = ref(false)

  function initAuth(): Promise<void> {
    if (subscribed) {
      return Promise.resolve()
    }
    subscribed = true
    return new Promise((resolve) => {
      let resolved = false
      firebaseAuth.onAuthStateChange((user) => {
        sessionStore.user = user
          ? mapFirebaseUserToAuthUser(user.uid, user.email ?? undefined)
          : null
        sessionStore.initialized = true
        if (!resolved) {
          resolved = true
          resolve()
        }
      })
    })
  }

  async function signInWithGoogle() {
    loading.value = true
    try {
      await signInWithPopup(firebaseAuth, googleProvider)
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    await firebaseSignOut(firebaseAuth)
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
