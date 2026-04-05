import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { firebaseAuth } from '@/lib/firebase'
import type { EmailImportLog } from '@/types/db'

export function useEmailImport(householdId: () => string | null) {
    const importLogs = ref<EmailImportLog[]>([])
    const importing = ref(false)
    const importMessage = ref('')
    const importError = ref('')
    const isGmailLinked = ref(false)

    async function checkGmailLinked() {
        try {
            const { data } = await supabase
                .from('gmail_tokens')
                .select('expires_at')
                .gt('expires_at', new Date().toISOString())
                .maybeSingle()
            
            isGmailLinked.value = !!data
        } catch (e) {
            isGmailLinked.value = false
        }
    }

    async function fetchImportLogs() {
        const hid = householdId()
        if (!hid) return

        const { data, error } = await supabase
            .from('email_import_logs')
            .select('*')
            .eq('household_id', hid)
            .order('imported_at', { ascending: false })
            .limit(50)

        if (error) throw error
        importLogs.value = (data ?? []) as EmailImportLog[]
    }

    async function triggerGmailImport() {
        importing.value = true
        importMessage.value = ''
        importError.value = ''

        try {
            const user = firebaseAuth.currentUser
            if (!user) {
                importError.value = 'ログインが必要です'
                return
            }

            const idToken = await user.getIdToken()
            const response = await fetch(`/api/gmail/sync`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
            })
            const json = await response.json() as { results?: any[]; error?: string }

            if (!response.ok || json.error) {
                importError.value = json.error || 'Gmail取込に失敗しました'
                return
            }

            importMessage.value = `Gmail取込が完了しました (${json.results?.length ?? 0}件)`
            await fetchImportLogs()
        } catch (e) {
            importError.value = e instanceof Error ? e.message : 'ネットワークエラーが発生しました'
        } finally {
            importing.value = false
        }
    }

    return {
        importLogs,
        importing,
        importMessage,
        importError,
        isGmailLinked,
        fetchImportLogs,
        checkGmailLinked,
        triggerGmailImport,
    }
}
