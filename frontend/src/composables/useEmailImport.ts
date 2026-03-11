import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { EmailImportLog } from '@/types/db'

export function useEmailImport(householdId: () => string | null) {
    const importLogs = ref<EmailImportLog[]>([])
    const importing = ref(false)
    const importMessage = ref('')
    const importError = ref('')

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
            const response = await fetch('/api/gas/gmail-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            const json = await response.json() as { ok?: boolean; message?: string; error?: string }

            if (!response.ok || json.error) {
                importError.value = json.error || 'Gmail取込に失敗しました'
                return
            }

            importMessage.value = 'Gmail取込を開始しました。1〜2分後にページを更新すると反映されます。'
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
        fetchImportLogs,
        triggerGmailImport,
    }
}
