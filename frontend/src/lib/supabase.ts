import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.')
}

// Supabase Auth を使用するため、accessToken の手動設定（Firebase連動）は不要
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
