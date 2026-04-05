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

const statusColor: Record<string, string> = {
  imported: 'text-secondary',
  skipped: 'text-on-surface-variant',
  error: 'text-error',
}

const statusLabel: Record<string, string> = {
  imported: '取込済',
  skipped: 'スキップ',
  error: 'エラー',
}

function fmt(n: number) {
  return `¥${n.toLocaleString()}`
}

const cardLabel: Record<string, string> = {
  smbc: '三井住友カード',
  rakuten: '楽天カード',
}
</script>

<template>
  <div class="space-y-5 pb-28">
    <section>
      <p class="font-label text-[11px] text-on-surface-variant font-semibold uppercase tracking-widest">メール連携</p>
      <h1 class="text-3xl font-extrabold tracking-tight text-on-surface font-headline mt-1">Gmail取込</h1>
    </section>

    <!-- Status card -->
    <div class="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm space-y-4">
      <div class="flex items-center gap-3">
        <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center', isGmailLinked ? 'bg-secondary-container' : 'bg-surface-container']">
          <span class="material-symbols-outlined text-2xl" :class="isGmailLinked ? 'text-on-secondary-container' : 'text-on-surface-variant'" style="font-variation-settings: 'FILL' 1;">mail</span>
        </div>
        <div>
          <p class="font-bold text-on-surface">Gmail連携状態</p>
          <p :class="['text-sm font-medium', isGmailLinked ? 'text-secondary' : 'text-on-surface-variant']">
            {{ isGmailLinked ? '連携済み・取込可能' : '未連携' }}
          </p>
        </div>
      </div>

      <button
        @click="triggerGmailImport"
        :disabled="importing || !isGmailLinked"
        class="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-2xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50"
      >
        <span class="material-symbols-outlined text-[18px]" :class="importing ? 'animate-spin' : ''">{{ importing ? 'progress_activity' : 'sync' }}</span>
        {{ importing ? '取込中...' : '今すぐ取込む' }}
      </button>

      <p v-if="importMessage" class="text-sm text-secondary text-center font-medium">✅ {{ importMessage }}</p>
      <p v-if="importError" class="text-sm text-error text-center font-medium">❌ {{ importError }}</p>
    </div>

    <!-- Info box -->
    <div class="bg-surface-container-low rounded-2xl p-4 text-sm text-on-surface-variant space-y-1">
      <p class="font-bold text-on-surface text-xs uppercase tracking-wider font-label">対応カード</p>
      <p>• 三井住友カード（ご利用通知メール）</p>
      <p>• 楽天カード（カード利用のお知らせ）</p>
      <p class="mt-2 text-xs">直近7日間のメールを自動取込します。毎時間自動実行もされます。</p>
    </div>

    <!-- Log list -->
    <section class="space-y-3">
      <h2 class="text-lg font-bold font-headline">取込ログ</h2>
      <div v-if="importLogs.length === 0" class="text-center py-8 text-on-surface-variant text-sm bg-surface-container-lowest rounded-2xl">
        取込ログがありません
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="log in importLogs"
          :key="log.id"
          class="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/10"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span :class="['text-xs font-bold', statusColor[log.status]]">{{ statusLabel[log.status] }}</span>
                <span class="text-xs text-on-surface-variant">{{ cardLabel[log.card_type] || log.card_type }}</span>
              </div>
              <p class="font-bold text-on-surface mt-1 truncate">{{ log.store_name }}</p>
              <p class="text-xs text-on-surface-variant mt-0.5">{{ log.transaction_date }}</p>
            </div>
            <p class="font-bold text-tertiary flex-shrink-0">{{ fmt(log.amount) }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
