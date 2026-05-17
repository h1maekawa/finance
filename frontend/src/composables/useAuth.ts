import { ref, onUnmounted } from 'vue'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

const user = ref<User | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Initialize auth state listener (singleton)
const unsubscribe = onAuthStateChanged(auth, (u) => {
  user.value = u
  loading.value = false
})

export function useAuth() {
  const loginWithEmail = async (email: string, password: string) => {
    error.value = null
    loading.value = true
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e: any) {
      error.value = e.message ?? 'ログインに失敗しました'
      throw e
    } finally {
      loading.value = false
    }
  }

  const registerWithEmail = async (email: string, password: string) => {
    error.value = null
    loading.value = true
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (e: any) {
      error.value = e.message ?? '登録に失敗しました'
      throw e
    } finally {
      loading.value = false
    }
  }

  const loginWithGoogle = async () => {
    error.value = null
    loading.value = true
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (e: any) {
      error.value = e.message ?? 'Googleログインに失敗しました'
      throw e
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const clearError = () => {
    error.value = null
  }

  return { user, loading, error, loginWithEmail, registerWithEmail, loginWithGoogle, logout, clearError }
}
