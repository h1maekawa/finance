import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { sessionStore } from '@/stores/session'
import type { UserNotificationChannel } from '@/types/db'

export function useNotificationChannels() {
  const lineChannel = ref<UserNotificationChannel | null>(null)
  const loading = ref(false)

  async function fetchLineChannel() {
    const uid = sessionStore.user?.id
    if (!uid) {
      lineChannel.value = null
      return
    }

    loading.value = true
    const { data, error } = await supabase
      .from('user_notification_channels')
      .select('id, user_id, provider, line_user_id, is_active')
      .eq('user_id', uid)
      .eq('provider', 'line')
      .maybeSingle()
    loading.value = false

    if (error) throw error
    lineChannel.value = (data ?? null) as UserNotificationChannel | null
  }

  async function saveLineChannel(lineUserId: string, isActive: boolean) {
    const uid = sessionStore.user?.id
    if (!uid) throw new Error('ログイン情報が取得できません。')

    const { data, error } = await supabase
      .from('user_notification_channels')
      .upsert({
        user_id: uid,
        provider: 'line',
        line_user_id: lineUserId.trim(),
        is_active: isActive,
      }, {
        onConflict: 'user_id,provider',
      })
      .select('id, user_id, provider, line_user_id, is_active')
      .single()

    if (error) throw error
    lineChannel.value = data as UserNotificationChannel
  }

  return {
    lineChannel,
    loading,
    fetchLineChannel,
    saveLineChannel,
  }
}
