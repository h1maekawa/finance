import { createClient } from '@supabase/supabase-js'
import { firebaseAuth } from '@/lib/firebase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.')
}

// Firebase 認証のみ使用。Supabase へのリクエストには Firebase ID トークンを付与する。
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => {
    const token = await firebaseAuth.currentUser?.getIdToken(false)
    return token ?? null
  },
})
