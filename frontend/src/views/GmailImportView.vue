<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEmailImport } from '@/composables/useEmailImport'
import { useHousehold } from '@/composables/useHousehold'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import { AIExtractionService, type ExtractedTransaction } from '@/services/aiExtractionService'
import { sessionStore } from '@/stores/session'
import { supabase } from '@/lib/supabase'
import { firebaseAuth } from '@/lib/firebase'

const { currentHouseholdId } = useHousehold()
const {
  importLogs,
  importing,
  importMessage,
  importError,
  isGmailLinked,
  fetchImportLogs,
  checkGmailLinked,
  triggerGmailImport,
} = useEmailImport(() => currentHouseholdId.value)

const { categories } = useCategories(() => currentHouseholdId.value)
const { fetchTransactions } = useTransactions(() => currentHouseholdId.value)

// Tab state
const activeTab = ref<'auto' | 'manual' | 'settings'>('auto')

// Manual import state
const manualEmailText = ref('')
const extractedResults = ref<ExtractedTransaction[]>([])
const isExtracting = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const isSaving = ref(false)

// Settings state
const filters = ref<any[]>([])
const loadingFilters = ref(false)
const showAddFilter = ref(false)
const newFilter = ref({ sender_email: '', subject_filter: '' })

const templates = [
  { name: '三井住友カード', sender: 'statement@vpass.ne.jp', subject: 'ご利用のお知らせ' },
  { name: '楽天カード', sender: 'info@mail.rakuten-card.co.jp', subject: 'カード利用のお知らせ' },
  { name: 'PayPayカード', sender: 'mail@paypay-card.co.jp', subject: 'カード利用のお知らせ' },
  { name: 'セブン-イレブン (通知)', sender: 'notification@7-11.co.jp', subject: 'ご利用確認' }, // Example
  { name: 'SMBCダイレクト', sender: 'info@standard.smbc.co.jp', subject: '出金' },
]

onMounted(async () => {
  await checkGmailLinked()
  await fetchImportLogs()
  await fetchFilters()
})

async function fetchFilters() {
  const uid = sessionStore.user?.id
  if (!uid) return
  loadingFilters.value = true
  const { data } = await supabase.from('gmail_sync_filters').select('*').eq('user_id', uid)
  filters.value = data || []
  loadingFilters.value = false
}

async function handleAddFilter(template?: typeof templates[0]) {
  const uid = sessionStore.user?.id
  if (!uid) return
  
  const payload = template 
    ? { sender_email: template.sender, subject_filter: template.subject, user_id: uid }
    : { ...newFilter.value, user_id: uid }

  const { error } = await supabase.from('gmail_sync_filters').insert(payload)
  if (!error) {
    await fetchFilters()
    showAddFilter.value = false
    newFilter.value = { sender_email: '', subject_filter: '' }
  }
}

async function deleteFilter(id: string) {
  await supabase.from('gmail_sync_filters').delete().eq('id', id)
  await fetchFilters()
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  imported: { bg: 'bg-secondary-container/50', text: 'text-on-secondary-container', label: '取込済' },
  skipped: { bg: 'bg-surface-container-high/50', text: 'text-on-surface-variant', label: '重複スキップ' },
  error: { bg: 'bg-error-container/50', text: 'text-on-error-container', label: 'エラー' },
}

function fmt(n: number) {
  return `¥${Math.floor(n).toLocaleString()}`
}

const cardLabel: Record<string, string> = {
  smbc: '三井住友',
  rakuten: '楽天',
  generic: '店舗通知',
}

async function handleExtract() {
  if (!manualEmailText.value) return
  isExtracting.value = true
  saveError.value = ''
  saveSuccess.value = ''
  
  await new Promise(resolve => setTimeout(resolve, 800))
  
  try {
    extractedResults.value = AIExtractionService.extract(manualEmailText.value)
    if (extractedResults.value.length === 0) {
      saveError.value = '取引データが見つかりませんでした。形式を確認してください。'
    }
  } finally {
    isExtracting.value = false
  }
}

async function handleSaveManual() {
  const hid = currentHouseholdId.value
  const uid = sessionStore.user?.id
  if (!hid || !uid) return

  isSaving.value = true
  saveError.value = ''
  
  try {
    const resultsToSave = extractedResults.value.map(res => {
      const category = categories.value.find(c => c.name === res.category && c.kind === res.transaction_type)
        || categories.value.find(c => c.kind === res.transaction_type)
      
      return {
        household_id: hid,
        user_id: uid,
        category_id: category?.id,
        kind: res.transaction_type,
        amount: res.amount,
        transaction_date: res.date.split(' ')[0],
        note: `[Manual] ${res.merchant}`,
      }
    })

    const { error } = await supabase.from('transactions').insert(resultsToSave)
    if (error) throw error

    saveSuccess.value = `${resultsToSave.length}件の取引を保存しました`
    manualEmailText.value = ''
    extractedResults.value = []
    await fetchTransactions()
  } catch (e) {
    saveError.value = '保存に失敗しました'
  } finally {
    isSaving.value = false
  }
}

async function handleGasImportShortcut() {
  importing.value = true
  try {
    const user = firebaseAuth.currentUser
    if (!user) {
      alert('ログインが必要です')
      return
    }
    const idToken = await user.getIdToken()
    const res = await fetch('/api/gas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ action: 'gmail_import' }),
    })
    const json = await res.json()
    if (res.ok) {
      alert('GAS側でのGmail取り込み依頼を送信しました。')
    } else {
      alert('GASエラー: ' + (json.error || '不明なエラー'))
    }
  } catch (e) {
    console.error(e)
    alert('通信エラーが発生しました。')
  } finally {
    importing.value = false
  }
}

function showGmailAuthAlert() {
  alert('管理画面からGoogle認証を実行してください（現在開発者モードのみ利用可能）')
}
</script>

<template>
  <div class="space-y-8 pb-32 animate-in fade-in duration-700">
    <section class="space-y-1">
      <p class="text-premium-label">明細データ取込</p>
      <h1 class="text-premium-headline text-3xl">データインポート</h1>
    </section>

    <!-- Tab Switcher -->
    <div class="flex p-1 bg-surface-container-low rounded-2xl overflow-x-auto no-scrollbar">
      <button 
        @click="activeTab = 'auto'"
        :class="['flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2', activeTab === 'auto' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant']"
      >
        <span class="material-symbols-outlined text-xl">auto_mode</span>
        Gmail同期
      </button>
      <button 
        @click="activeTab = 'manual'"
        :class="['flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2', activeTab === 'manual' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant']"
      >
        <span class="material-symbols-outlined text-xl">psychology</span>
        AI解析
      </button>
      <button 
        @click="activeTab = 'settings'"
        :class="['flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2', activeTab === 'settings' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant']"
      >
        <span class="material-symbols-outlined text-xl">settings</span>
        設定
      </button>
    </div>

    <!-- Auto Sync View -->
    <div v-if="activeTab === 'auto'" class="space-y-8 animate-in fade-in">
      <div class="card-premium relative overflow-hidden space-y-6">
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div class="flex items-center gap-4 relative z-10">
          <div :class="['w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500', isGmailLinked ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant']">
            <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">
              {{ isGmailLinked ? 'mail' : 'mail_lock' }}
            </span>
          </div>
          <div class="space-y-0.5">
            <p class="text-premium-headline text-xl">Gmail連携 {{ isGmailLinked ? '完了' : '未設定' }}</p>
            <p class="text-premium-label !normal-case !opacity-60">
              {{ isGmailLinked ? '毎時間の自動取込が有効です' : '連携してカード明細を自動化しましょう' }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 relative z-10">
          <template v-if="isGmailLinked">
            <button
              @click="triggerGmailImport"
              :disabled="importing"
              class="w-full h-14 bg-primary text-on-primary rounded-[1.25rem] font-bold active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale shadow-lg shadow-primary/20"
            >
              <span class="material-symbols-outlined text-2xl" :class="{ 'animate-spin': importing }">
                {{ importing ? 'progress_activity' : 'sync' }}
              </span>
              <span>{{ importing ? '取込を実行中...' : '今すぐ同期する' }}</span>
            </button>
          </template>
          <template v-else>
            <div class="p-4 bg-surface-container-highest rounded-2xl space-y-3">
              <p class="text-xs text-on-surface-variant leading-relaxed">
                自動同期を利用するには、Googleアカウントの連携とサーバー側の設定（Cron）が必要です。
              </p>
              <button
                class="w-full h-12 bg-on-surface text-surface rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                @click="showGmailAuthAlert"
              >
                <span class="material-symbols-outlined text-xl">login</span>
                Googleアカウントを連携
              </button>
            </div>
          </template>

          <!-- GAS Sync Shortcut -->
          <div class="pt-4 border-t border-outline-variant/10">
            <p class="text-[10px] font-bold text-on-surface-variant mb-2">OTHER OPTIONS</p>
            <button 
              @click="handleGasImportShortcut"
              class="w-full h-12 border border-outline-variant/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-surface-container transition-colors"
            >
              <span class="material-symbols-outlined text-lg">description</span>
              スプレッドシート(GAS)から取込
            </button>
          </div>
        </div>
      </div>

      <section class="space-y-6">
        <h2 class="text-premium-headline text-2xl">履歴</h2>
        <div v-if="importLogs.length === 0" class="text-center py-20 card-premium !bg-transparent border-dashed">
          <span class="material-symbols-outlined text-4xl text-outline-variant mb-3">history</span>
          <p class="text-on-surface-variant text-sm font-medium">履歴はありません</p>
        </div>
        <div v-else class="space-y-4">
          <div v-for="log in importLogs" :key="log.id" class="card-premium !p-4 flex items-center justify-between">
            <div class="flex items-center gap-4 min-w-0">
              <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', statusStyles[log.status]?.bg]">
                <span class="material-symbols-outlined text-xl" :class="statusStyles[log.status]?.text">
                  {{ log.status === 'imported' ? 'check_circle' : 'block' }}
                </span>
              </div>
              <div class="min-w-0">
                <span class="text-[10px] font-bold text-on-surface-variant">{{ cardLabel[log.card_type] || log.card_type }}</span>
                <p class="font-bold text-on-surface truncate">{{ log.store_name }}</p>
                <p class="text-[10px] opacity-60">{{ log.transaction_date }}</p>
              </div>
            </div>
            <p class="text-tertiary font-extrabold text-sm">{{ fmt(log.amount) }}</p>
          </div>
        </div>
      </section>
    </div>

    <!-- Manual AI Import View -->
    <div v-if="activeTab === 'manual'" class="space-y-6 animate-in fade-in">
       <div class="card-premium space-y-4">
        <textarea
          v-model="manualEmailText"
          placeholder="メール本文を貼り付け..."
          class="w-full h-48 p-4 bg-surface-container rounded-2xl border-none outline-none text-sm font-medium resize-none shadow-inner"
        ></textarea>
        <button
          @click="handleExtract"
          :disabled="isExtracting || !manualEmailText"
          class="w-full h-14 bg-secondary text-on-secondary rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <span class="material-symbols-outlined" :class="{ 'animate-spin': isExtracting }">magic_button</span>
          <span>AIで解析する</span>
        </button>
      </div>

      <div v-if="extractedResults.length > 0" class="space-y-4 animate-in slide-in-from-bottom">
        <div v-for="(res, idx) in extractedResults" :key="idx" class="card-premium !p-5 border-l-4 border-primary flex justify-between">
          <div>
            <p class="text-[10px] font-bold text-primary">{{ res.category }} • {{ res.date }}</p>
            <p class="font-bold">{{ res.merchant }}</p>
          </div>
          <p class="text-xl font-black text-primary">{{ fmt(res.amount) }}</p>
        </div>
        <button @click="handleSaveManual" :disabled="isSaving" class="w-full h-16 bg-primary text-on-primary rounded-[1.5rem] font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3">
          <span>{{ isSaving ? '保存中...' : 'この内容で保存する' }}</span>
        </button>
      </div>
    </div>

    <!-- Settings View -->
    <div v-if="activeTab === 'settings'" class="space-y-6 animate-in fade-in">
      <section class="card-premium space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-premium-headline text-xl">自動取込用アドレス</h2>
          <button @click="showAddFilter = !showAddFilter" class="btn-icon-premium !bg-primary/10 !text-primary">
            <span class="material-symbols-outlined">{{ showAddFilter ? 'close' : 'add' }}</span>
          </button>
        </div>

        <!-- Add Filter UI -->
        <div v-if="showAddFilter" class="space-y-4 p-4 bg-surface-container rounded-2xl animate-in slide-in-from-top">
          <p class="text-xs font-bold text-on-surface-variant mb-2">テンプレートから選ぶ</p>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="t in templates" 
              :key="t.name"
              @click="handleAddFilter(t)"
              class="px-3 py-1.5 bg-white border border-outline-variant/20 rounded-full text-xs font-bold text-on-surface hover:bg-primary/5 transition-colors"
            >
              + {{ t.name }}
            </button>
          </div>
          
          <div class="pt-4 border-t border-outline-variant/10">
            <p class="text-xs font-bold text-on-surface-variant mb-3">カスタム登録</p>
            <div class="space-y-3">
              <input v-model="newFilter.sender_email" placeholder="送信元アドレス" class="w-full p-3 rounded-xl bg-white text-sm outline-none border border-outline-variant/20 focus:border-primary/30" />
              <input v-model="newFilter.subject_filter" placeholder="件名キーワード（任意）" class="w-full p-3 rounded-xl bg-white text-sm outline-none border border-outline-variant/20 focus:border-primary/30" />
              <button @click="handleAddFilter()" :disabled="!newFilter.sender_email" class="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm">追加する</button>
            </div>
          </div>
        </div>

        <!-- Filters List -->
        <div v-if="filters.length === 0" class="text-center py-10 opacity-50">
          <p class="text-sm">設定されたアドレスはありません</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="f in filters" :key="f.id" class="flex items-center justify-between p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
            <div class="min-w-0">
              <p class="font-bold text-sm truncate">{{ f.sender_email }}</p>
              <p class="text-[10px] text-on-surface-variant truncate">{{ f.subject_filter || '件名指定なし' }}</p>
            </div>
            <button @click="deleteFilter(f.id)" class="text-error opacity-40 hover:opacity-100 transition-opacity">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </section>

      <div class="p-5 bg-secondary/5 rounded-[2rem] border border-secondary/10">
        <div class="flex items-center gap-3 mb-3">
           <span class="material-symbols-outlined text-secondary">info</span>
           <p class="font-bold text-sm text-secondary">自動同期の仕組み</p>
        </div>
        <p class="text-xs text-on-surface-variant leading-relaxed">
          登録したアドレスからメールが届くと、1時間ごとにシステムが内容を解析し、自動的に支出・収入として登録します。店名や金額の抽出にはAI解析エンジンを使用します。
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fade-in 0.6s ease-out forwards;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.slide-in-from-bottom {
  animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.slide-in-from-top {
  animation: slide-down 0.4s ease-out forwards;
}
</style>
