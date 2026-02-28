import { onMounted, ref } from 'vue'
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { firebaseAuth, googleProvider } from '@/lib/firebase'
import { sessionStore } from '@/stores/session'
import type { AuthUser } from '@/stores/session'

let subscribed = false

function mapFirebaseUserToAuthUser(uid: string, email?: string | null, name?: string | null): AuthUser {
  return { id: uid, email: email ?? null, name: name ?? null }
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
      onAuthStateChanged(firebaseAuth, (user) => {
        sessionStore.user = user
          ? mapFirebaseUserToAuthUser(user.uid, user.email ?? undefined, user.displayName ?? undefined)
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
