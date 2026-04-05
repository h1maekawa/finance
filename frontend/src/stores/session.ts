import { reactive } from 'vue'
import { firebaseAuth } from '@/lib/firebase'

/** Firebase 認証のみ使用時のユーザー情報（Supabase 型に合わせた最小形状） */
export interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
}

export const sessionStore = reactive<{
  user: AuthUser | null
  initialized: boolean
  gmailSyncing: boolean
  gmailLastSync: string | null
}>({
  user: null,
  initialized: false,
  gmailSyncing: false,
  gmailLastSync: null,
})

/**
 * ログイン直後に呼ばれる Gmail 自動同期関数。
 * /api/gmail/sync に Firebase ID Token を付けて POST する。
 */
export async function syncGmail(): Promise<void> {
  const user = firebaseAuth.currentUser
  if (!user) return

  sessionStore.gmailSyncing = true
  try {
    const token = await user.getIdToken()
    const res = await fetch('/api/gmail/sync', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (res.ok) {
      sessionStore.gmailLastSync = new Date().toISOString()
    }
  } catch (e) {
    console.error('Gmail sync failed:', e)
  } finally {
    sessionStore.gmailSyncing = false
  }
}
