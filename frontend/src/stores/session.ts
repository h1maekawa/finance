import { reactive } from 'vue'
import type { Session, User } from '@supabase/supabase-js'

export const sessionStore = reactive<{
  session: Session | null
  user: User | null
  initialized: boolean
}>({
  session: null,
  user: null,
  initialized: false,
})
