import { createClient } from '@supabase/supabase-js'
import { firebaseAuth } from './firebase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options = {}) => {
      const user = firebaseAuth.currentUser
      let finalOptions = { ...options }
      
      if (user) {
        try {
          // getIdToken(false) automatically refreshes if expired
          const token = await user.getIdToken()
          const headers = new Headers(options.headers)
          headers.set('Authorization', `Bearer ${token}`)
          finalOptions.headers = headers
        } catch (e) {
          console.error('Failed to get Firebase token', e)
        }
      }

      const res = await fetch(url, finalOptions)

      // 401/403 indicates token is invalid or RLS rejected it
      if (res.status === 401 || res.status === 403) {
        console.warn('Supabase request unauthorized. Clearing session.')
        // We can trigger a global event or clear the store
        // For now, reload to force session re-init if really invalid
        // Or just let the user know via a global state
        if (typeof window !== 'undefined') {
          // Use a custom event that useAuth or sessionStore can listen to
          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        }
      }

      return res
    }
  }
})
