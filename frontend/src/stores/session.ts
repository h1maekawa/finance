import { reactive } from 'vue'

type AppUser = {
  id: string
  email: string | null
  displayName: string | null
}

export const sessionStore = reactive<{
  user: AppUser | null
  initialized: boolean
}>({
  user: null,
  initialized: false,
})
