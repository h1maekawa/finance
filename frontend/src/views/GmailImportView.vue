<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEmailImport } from '@/composables/useEmailImport'
import { useHousehold } from '@/composables/useHousehold'

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

onMounted(async () => {
  await checkGmailLinked()
  await fetchImportLogs()
})

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
}
</script>

<template>
  <div class="space-y-8 pb-32 animate-in fade-in duration-700">
    <section class="space-y-1 px-1">
      <p class="text-premium-label">自動取込設定</p>
      <h1 class="text-premium-headline text-3xl">Gmail連携</h1>
    </section>

    <!-- Sync Controls Card -->
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
        <button
          @click="triggerGmailImport"
          :disabled="importing || !isGmailLinked"
          class="w-full h-14 bg-primary text-on-primary rounded-[1.25rem] font-bold active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale shadow-lg shadow-primary/20"
        >
          <span class="material-symbols-outlined text-2xl" :class="{ 'animate-spin': importing }">
            {{ importing ? 'progress_activity' : 'sync' }}
          </span>
          <span>{{ importing ? '取込を実行中...' : '今すぐ同期する' }}</span>
        </button>
        
        <p v-if="importMessage" class="text-center text-sm font-bold text-secondary animate-in fade-in py-2">
          {{ importMessage }}
        </p>
        <p v-if="importError" class="text-center text-sm font-bold text-error animate-in fade-in py-2">
          {{ importError }}
        </p>
      </div>
    </div>

    <!-- Supported Cards Info -->
    <section class="px-1 grid grid-cols-2 gap-4">
      <div class="p-4 bg-surface-container-low/50 rounded-[1.5rem] border border-outline-variant/10">
        <div class="flex items-center gap-2 mb-2">
          <span class="material-symbols-outlined text-primary text-xl">credit_card</span>
          <p class="text-premium-headline text-sm">対応カード</p>
        </div>
        <ul class="text-[12px] text-on-surface-variant space-y-1 font-medium">
          <li>• 三井住友カード</li>
          <li>• 楽天カード</li>
        </ul>
      </div>
      <div class="p-4 bg-surface-container-low/50 rounded-[1.5rem] border border-outline-variant/10">
        <div class="flex items-center gap-2 mb-2">
          <span class="material-symbols-outlined text-secondary text-xl">schedule</span>
          <p class="text-premium-headline text-sm">自動スケジューラ</p>
        </div>
        <p class="text-[12px] text-on-surface-variant leading-relaxed font-medium">
          1時間ごとにバックグラウンドで新しい明細をチェックします。
        </p>
      </div>
    </section>

    <!-- Import Logs -->
    <section class="space-y-6 px-1">
      <h2 class="text-premium-headline text-2xl">履歴</h2>
      
      <div v-if="importLogs.length === 0" class="text-center py-20 card-premium !bg-transparent border-dashed">
        <span class="material-symbols-outlined text-4xl text-outline-variant mb-3">history</span>
        <p class="text-on-surface-variant text-sm font-medium">取込履歴はまだありません</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="log in importLogs"
          :key="log.id"
          class="card-premium !p-4 flex items-center justify-between hover:bg-surface-container-lowest active:scale-[0.99] transition-all"
        >
          <div class="flex items-center gap-4 min-w-0">
            <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', statusStyles[log.status]?.bg || 'bg-surface-container']">
              <span class="material-symbols-outlined text-xl" :class="statusStyles[log.status]?.text">
                {{ log.status === 'imported' ? 'check_circle' : (log.status === 'error' ? 'error' : 'block') }}
              </span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                 <span class="text-premium-label !text-[10px]">{{ cardLabel[log.card_type] || log.card_type }}</span>
                 <div class="w-1 h-1 rounded-full bg-outline-variant"></div>
                 <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase', statusStyles[log.status]?.text, statusStyles[log.status]?.bg]">
                   {{ statusStyles[log.status]?.label }}
                 </span>
              </div>
              <p class="font-bold text-on-surface truncate">{{ log.store_name }}</p>
              <p class="text-premium-label !normal-case !opacity-60 text-[10px]">{{ log.transaction_date }}</p>
            </div>
          </div>
          <p class="text-tertiary font-extrabold text-sm whitespace-nowrap ml-4">
            {{ log.amount > 0 ? fmt(log.amount) : '-' }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fade-in 0.6s ease-out forwards;
}
</style>
