import { createClient } from '@supabase/supabase-js'
import { firebaseAuth } from '@/lib/firebase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => {
    const user = firebaseAuth.currentUser
    if (!user) return null
    return user.getIdToken()
  },
})
