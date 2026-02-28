import { reactive } from 'vue'

/** Firebase 認証のみ使用時のユーザー情報（Supabase 型に合わせた最小形状） */
export interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
}

export const sessionStore = reactive<{
  user: AuthUser | null
  initialized: boolean
}>({
  user: null,
  initialized: false,
})
