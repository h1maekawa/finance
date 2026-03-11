<script setup lang="ts">
import { onMounted } from 'vue'
import { useHousehold } from '@/composables/useHousehold'
import { useEmailImport } from '@/composables/useEmailImport'

const { currentHouseholdId } = useHousehold()
const {
  importLogs,
  importing,
  importMessage,
  importError,
  fetchImportLogs,
  triggerGmailImport,
} = useEmailImport(() => currentHouseholdId.value)

onMounted(() => fetchImportLogs())

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function cardLabel(type: string) {
  if (type === 'smbc') return '三井住友カード'
  if (type === 'rakuten') return '楽天カード'
  return type
}

function statusLabel(status: string) {
  if (status === 'imported') return { label: '取込済', class: 'gmail-import__status--ok' }
  if (status === 'skipped') return { label: 'スキップ', class: 'gmail-import__status--skip' }
  return { label: 'エラー', class: 'gmail-import__status--error' }
}
</script>

<template>
  <main class="gmail-import">
    <!-- ヒーローセクション -->
    <section class="gmail-import__hero">
      <div class="gmail-import__hero-icon">📧</div>
      <h1 class="gmail-import__hero-title">クレジット自動取込</h1>
      <p class="gmail-import__hero-desc">
        三井住友カード・楽天カードのご利用通知メールを自動で読み取り、支出を記録します。
      </p>
    </section>

    <!-- 対応カード -->
    <section class="gmail-import__cards-section">
      <div class="gmail-import__card-badge smbc">
        <span class="gmail-import__card-badge-icon">💳</span>
        <div>
          <p class="gmail-import__card-badge-name">三井住友カード</p>
          <p class="gmail-import__card-badge-email">statement@vpass.ne.jp</p>
        </div>
        <span class="gmail-import__status-dot active"></span>
      </div>
      <div class="gmail-import__card-badge rakuten">
        <span class="gmail-import__card-badge-icon">💳</span>
        <div>
          <p class="gmail-import__card-badge-name">楽天カード</p>
          <p class="gmail-import__card-badge-email">info@mail.rakuten-card.co.jp</p>
        </div>
        <span class="gmail-import__status-dot active"></span>
      </div>
    </section>

    <!-- 手動実行ボタン -->
    <section class="gmail-import__action">
      <button
        class="gmail-import__trigger-btn"
        :disabled="importing"
        @click="triggerGmailImport"
      >
        <span v-if="importing">⏳ 取込中...</span>
        <span v-else>🔄 今すぐ取込を実行</span>
      </button>
      <p class="gmail-import__note">
        ※ GASのタイムトリガーで1時間おきに自動実行されます。手動で即時実行したい場合はボタンを押してください。
      </p>
      <p v-if="importMessage" class="gmail-import__message">{{ importMessage }}</p>
      <p v-if="importError" class="gmail-import__error">{{ importError }}</p>
    </section>

    <!-- 取込ログ -->
    <section class="gmail-import__log-section">
      <div class="gmail-import__log-header">
        <h2 class="gmail-import__log-title">取込履歴</h2>
        <button class="gmail-import__refresh-btn" @click="fetchImportLogs">更新</button>
      </div>

      <p v-if="importLogs.length === 0" class="gmail-import__empty">
        まだ取込履歴がありません。
      </p>

      <div v-else class="gmail-import__log-list">
        <article
          v-for="log in importLogs"
          :key="log.id"
          class="gmail-import__log-item"
        >
          <div class="gmail-import__log-left">
            <span class="gmail-import__log-date">{{ log.transaction_date }}</span>
            <span class="gmail-import__log-store">{{ log.store_name }}</span>
            <span class="gmail-import__log-card">{{ cardLabel(log.card_type) }}</span>
          </div>
          <div class="gmail-import__log-right">
            <span class="gmail-import__log-amount">¥{{ Number(log.amount).toLocaleString() }}</span>
            <span :class="['gmail-import__status', statusLabel(log.status).class]">
              {{ statusLabel(log.status).label }}
            </span>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.gmail-import {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 2rem;
}

/* ヒーロー */
.gmail-import__hero {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  border-radius: 20px;
  padding: 2rem 1.5rem;
  text-align: center;
}
.gmail-import__hero-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.gmail-import__hero-title { margin: 0 0 0.5rem; font-size: 1.4rem; font-weight: 800; }
.gmail-import__hero-desc { margin: 0; font-size: 0.9rem; opacity: 0.9; line-height: 1.6; }

/* 対応カードバッジ */
.gmail-import__cards-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.gmail-import__card-badge {
  background: #fff;
  border-radius: 14px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-left: 4px solid #6366f1;
}
.gmail-import__card-badge.rakuten { border-left-color: #ef4444; }
.gmail-import__card-badge-icon { font-size: 1.5rem; }
.gmail-import__card-badge-name { margin: 0; font-weight: 700; font-size: 0.95rem; }
.gmail-import__card-badge-email { margin: 0; font-size: 0.78rem; color: #6b7280; }
.gmail-import__status-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: #d1d5db; margin-left: auto;
}
.gmail-import__status-dot.active { background: #10b981; }

/* アクション */
.gmail-import__action {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.gmail-import__trigger-btn {
  width: 100%;
  padding: 0.9rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}
.gmail-import__trigger-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.gmail-import__note { margin: 0.75rem 0 0; font-size: 0.8rem; color: #9ca3af; }
.gmail-import__message { margin: 0.5rem 0 0; color: #059669; font-size: 0.9rem; }
.gmail-import__error { margin: 0.5rem 0 0; color: #dc2626; font-size: 0.9rem; }

/* ログ */
.gmail-import__log-section {
  background: #fff;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.gmail-import__log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.gmail-import__log-title { margin: 0; font-size: 1rem; font-weight: 700; }
.gmail-import__refresh-btn {
  padding: 0.35rem 0.75rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.82rem;
}
.gmail-import__empty { color: #9ca3af; font-size: 0.9rem; text-align: center; }
.gmail-import__log-list { display: flex; flex-direction: column; gap: 0.5rem; }
.gmail-import__log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #f3f4f6;
}
.gmail-import__log-left { display: flex; flex-direction: column; gap: 0.15rem; }
.gmail-import__log-date { font-size: 0.78rem; color: #9ca3af; }
.gmail-import__log-store { font-weight: 600; font-size: 0.9rem; }
.gmail-import__log-card { font-size: 0.75rem; color: #6366f1; }
.gmail-import__log-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
.gmail-import__log-amount { font-weight: 800; font-size: 1rem; }
.gmail-import__status { font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 6px; }
.gmail-import__status--ok { background: #dcfce7; color: #166534; }
.gmail-import__status--skip { background: #fef9c3; color: #854d0e; }
.gmail-import__status--error { background: #fee2e2; color: #991b1b; }
</style>
