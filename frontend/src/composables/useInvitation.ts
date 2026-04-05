import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useInvitation(householdId: () => string | null) {
  const invitations = ref<any[]>([])
  const members = ref<any[]>([])
  const loading = ref(false)

  async function fetchMembers() {
    const hid = householdId()
    if (!hid) return
    const { data } = await supabase
      .from('household_members')
      .select('user_id, role, profiles(display_name, avatar_url)')
      .eq('household_id', hid)
    members.value = data ?? []
  }

  async function fetchInvitations() {
    const hid = householdId()
    if (!hid) return
    const { data } = await supabase
      .from('household_invitations')
      .select('*')
      .eq('household_id', hid)
      .is('accepted_at', null)
    invitations.value = data ?? []
  }

  async function createInvitation(email: string) {
    const hid = householdId()
    if (!hid) return
    
    // Import sessionStore locally here if not imported at the top, but better to import it at top.
    // Instead of importing sessionStore, we can just use firebaseAuth since we already have Firebase configured.
    // Wait, firebaseAuth gives us current user synchronously.

    const { firebaseAuth } = await import('@/lib/firebase')
    const user = firebaseAuth.currentUser
    if (!user) throw new Error('Not authenticated')

    const token = crypto.randomUUID()
    const { error } = await supabase.from('household_invitations').insert({
      household_id: hid,
      inviter_user_id: user.uid,
      email,
      token,
      role: 'member'
    })
    if (error) throw error
    await fetchInvitations()
    return token
  }

  async function revokeInvitation(id: string) {
    await supabase.from('household_invitations').delete().eq('id', id)
    await fetchInvitations()
  }

  return {
    invitations,
    members,
    loading,
    fetchMembers,
    fetchInvitations,
    createInvitation,
    revokeInvitation
  }
}
