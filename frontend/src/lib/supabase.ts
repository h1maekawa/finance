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
      if (user) {
        try {
          // getIdToken(false) automatically refreshes if expired
          const token = await user.getIdToken()
          const headers = new Headers(options.headers)
          headers.set('Authorization', `Bearer ${token}`)
          return fetch(url, { ...options, headers })
        } catch (e) {
          console.error('Failed to get Firebase token', e)
        }
      }
      return fetch(url, options)
    }
  }
})
