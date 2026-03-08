<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

const LS_KEYS = {
  records: 'finance_records',
  incomeRecords: 'finance_income_records',
  monthlyHistory: 'finance_monthly_history',
  gmailClientId: 'gmail_client_id',
  gmailCheckInterval: 'gmail_check_interval',
  gmailKeywords: 'gmail_subject_keywords',
  importedMailIds: 'finance_imported_mail_ids'
}

const VIEW_ITEMS = [
  { id: 'dashboard', label: 'ダッシュボード' },
  { id: 'input', label: '入力' },
  { id: 'records', label: '支出一覧' },
  { id: 'settings', label: '設定' },
  { id: 'help', label: 'ヘルプ' }
]

const PAYMENT_METHODS = ['credit', 'cash', 'paypay', 'bank']
const PAYMENT_LABELS = {
  credit: 'クレジット',
  cash: '現金',
  paypay: 'PayPay',
  bank: '口座振替'
}

const CATEGORY_COLORS = ['#1d4ed8', '#14b8a6', '#f97316', '#ec4899', '#7c3aed', '#16a34a']

const now = new Date()
const activeView = ref('input')
const records = ref(readJson(LS_KEYS.records, []))
const incomeRecords = ref(readJson(LS_KEYS.incomeRecords, []))
const monthlyHistory = ref(readJson(LS_KEYS.monthlyHistory, []))
const importedMailIds = ref(new Set(readJson(LS_KEYS.importedMailIds, [])))

const emailText = ref('')
const parsedEmail = ref(null)
const parseError = ref('')

const manualForm = reactive({
  date: formatDateOnly(now),
  store: '',
  amount: '',
  category: '生活',
  paymentMethod: 'cash'
})

const incomeForm = reactive({
  date: formatDateOnly(now),
  source: '',
  amount: ''
})

const toasts = ref([])
let toastSeed = 1

const deleteTarget = ref(null)

const gmailClientId = ref(localStorage.getItem(LS_KEYS.gmailClientId) || '')
const gmailCheckInterval = ref(localStorage.getItem(LS_KEYS.gmailCheckInterval) || 'manual')
const gmailKeywords = ref(localStorage.getItem(LS_KEYS.gmailKeywords) || 'ご利用のお知らせ,クレジット')
const gmailConnected = ref(false)
const gmailStatusText = ref('未接続')
const isImporting = ref(false)
const importModalOpen = ref(false)
const importCandidates = ref([])

let gmailScriptReady = false
let tokenClient = null
let accessToken = ''
let tokenExpiresAt = 0
let checkTimerId = null

const sortedRecords = computed(() => {
  return [...records.value].sort((a, b) => new Date(b.date) - new Date(a.date))
})

const currentMonthRange = computed(() => getMonthRange(new Date()))
const previousMonthRange = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return getMonthRange(d)
})

const currentMonthRecords = computed(() => {
  return records.value.filter((r) => isDateInRange(r.date, currentMonthRange.value))
})

const previousMonthRecords = computed(() => {
  return records.value.filter((r) => isDateInRange(r.date, previousMonthRange.value))
})

const currentMonthIncomeRecords = computed(() => {
  return incomeRecords.value.filter((r) => isDateInRange(r.date, currentMonthRange.value))
})

const currentMonthTotal = computed(() => sumAmount(currentMonthRecords.value))
const previousMonthTotal = computed(() => sumAmount(previousMonthRecords.value))
const currentMonthIncomeTotal = computed(() => sumAmount(currentMonthIncomeRecords.value))
const currentMonthBalance = computed(() => currentMonthIncomeTotal.value - currentMonthTotal.value)
const monthDiff = computed(() => currentMonthTotal.value - previousMonthTotal.value)

const paymentBreakdown = computed(() => {
  const total = currentMonthTotal.value || 1
  return PAYMENT_METHODS
    .map((method) => {
      const methodTotal = currentMonthRecords.value
        .filter((r) => r.paymentMethod === method)
        .reduce((acc, r) => acc + Number(r.amount), 0)
      return {
        method,
        label: PAYMENT_LABELS[method],
        amount: methodTotal,
        ratio: Math.round((methodTotal / total) * 100)
      }
    })
    .filter((item) => item.amount > 0)
})

const categoryBreakdown = computed(() => {
  const map = new Map()
  currentMonthRecords.value.forEach((r) => {
    map.set(r.category, (map.get(r.category) || 0) + Number(r.amount))
  })
  const max = Math.max(...map.values(), 1)
  return [...map.entries()]
    .map(([category, amount], index) => ({
      category,
      amount,
      width: Math.round((amount / max) * 100),
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }))
    .sort((a, b) => b.amount - a.amount)
})

watch(
  records,
  (value) => {
    localStorage.setItem(LS_KEYS.records, JSON.stringify(value))
  },
  { deep: true }
)

watch(
  incomeRecords,
  (value) => {
    localStorage.setItem(LS_KEYS.incomeRecords, JSON.stringify(value))
  },
  { deep: true }
)

watch(
  [records, incomeRecords],
  () => {
    monthlyHistory.value = buildMonthlyHistory(records.value, incomeRecords.value)
    localStorage.setItem(LS_KEYS.monthlyHistory, JSON.stringify(monthlyHistory.value))
  },
  { deep: true, immediate: true }
)

watch(gmailClientId, (value) => {
  localStorage.setItem(LS_KEYS.gmailClientId, value)
  initializeTokenClient()
})

watch(gmailCheckInterval, (value) => {
  localStorage.setItem(LS_KEYS.gmailCheckInterval, value)
  setupAutoCheckTimer()
})

watch(gmailKeywords, (value) => {
  localStorage.setItem(LS_KEYS.gmailKeywords, value)
})

watch(emailText, (value) => {
  if (!value.trim()) {
    parsedEmail.value = null
    parseError.value = ''
    return
  }
  const parsed = parseExpenseText(value)
  if (parsed) {
    parsedEmail.value = parsed
    parseError.value = ''
  } else {
    parsedEmail.value = null
    parseError.value = 'メール形式を認識できません。ご利用日時・店舗・金額が含まれる本文を貼り付けてください。'
  }
})

onMounted(async () => {
  await loadGoogleIdentityScript()
  initializeTokenClient()
  setupAutoCheckTimer()
})

onBeforeUnmount(() => {
  if (checkTimerId) {
    clearInterval(checkTimerId)
  }
})

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function createRecord(payload) {
  return {
    id: crypto.randomUUID(),
    date: payload.date,
    store: payload.store,
    amount: Number(payload.amount),
    category: payload.category || '未分類',
    paymentMethod: payload.paymentMethod || 'cash',
    source: payload.source || 'manual',
    mailId: payload.mailId || null,
    createdAt: new Date().toISOString()
  }
}

function isDuplicate(payload) {
  return records.value.some(
    (r) => r.date === payload.date && r.store === payload.store && Number(r.amount) === Number(payload.amount)
  )
}

function registerManualExpense() {
  const payload = {
    date: manualForm.date,
    store: manualForm.store.trim(),
    amount: Number(manualForm.amount),
    category: manualForm.category.trim() || '未分類',
    paymentMethod: manualForm.paymentMethod,
    source: 'manual'
  }

  if (!payload.date || !payload.store || !payload.amount) {
    pushToast('warning', '⚠️ 必須項目を入力してください')
    return
  }

  if (isDuplicate(payload)) {
    pushToast('warning', '⚠️ 同じ内容がすでに登録されています')
    return
  }

  records.value.push(createRecord(payload))
  manualForm.store = ''
  manualForm.amount = ''
  manualForm.category = '生活'
  manualForm.paymentMethod = 'cash'
  pushToast('success', '✅ 支出を登録しました')
}

function registerIncome() {
  const payload = {
    id: crypto.randomUUID(),
    date: incomeForm.date,
    source: incomeForm.source.trim() || '収入',
    amount: Number(incomeForm.amount),
    createdAt: new Date().toISOString()
  }

  if (!payload.date || !payload.amount) {
    pushToast('warning', '⚠️ 収入の必須項目を入力してください')
    return
  }

  const duplicated = incomeRecords.value.some(
    (r) => r.date === payload.date && r.source === payload.source && Number(r.amount) === Number(payload.amount)
  )
  if (duplicated) {
    pushToast('warning', '⚠️ 同じ内容がすでに登録されています')
    return
  }

  incomeRecords.value.push(payload)
  incomeForm.source = ''
  incomeForm.amount = ''
  pushToast('success', '✅ 収入を登録しました')
}

function registerParsedExpense() {
  if (!parsedEmail.value) return

  const payload = {
    ...parsedEmail.value,
    paymentMethod: 'credit',
    source: 'auto'
  }

  if (isDuplicate(payload)) {
    pushToast('warning', '⚠️ 同じ内容がすでに登録されています')
    return
  }

  records.value.push(createRecord(payload))
  emailText.value = ''
  parsedEmail.value = null
  parseError.value = ''
  pushToast('success', '✅ 支出を登録しました')
}

function askDelete(record) {
  deleteTarget.value = record
}

function confirmDelete() {
  if (!deleteTarget.value) return
  records.value = records.value.filter((r) => r.id !== deleteTarget.value.id)
  deleteTarget.value = null
  pushToast('danger', '🗑️ 削除しました')
}

function cancelDelete() {
  deleteTarget.value = null
}

function pushToast(type, message) {
  const id = toastSeed++
  toasts.value.push({ id, type, message })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 3000)
}

function sourceLabel(source) {
  return source === 'auto' ? '🤖 自動' : '✍️ 手動'
}

function sourceClass(source) {
  return source === 'auto' ? 'badge-auto' : 'badge-manual'
}

function formatAmount(value) {
  return Number(value).toLocaleString('ja-JP')
}

function formatDateOnly(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseExpenseText(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  const dateMatch = text.match(/(?:ご利用日時|利用日時|日時|日付)\s*[：:]?\s*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/) ||
    text.match(/(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/)

  const lineCandidate = lines.find((line) => /円/.test(line) && /(\d[\d,]*)\s*円/.test(line)) || text
  const amountMatch = lineCandidate.match(/(\d[\d,]*)\s*円/) || text.match(/(\d[\d,]*)\s*円/)

  if (!dateMatch || !amountMatch) return null

  const detailMatch = lineCandidate.match(/(.+?)(?:（([^）]+)）)?\s*[\t ]+(\d[\d,]*)\s*円/)

  const store = (detailMatch?.[1] || lines.find((line) => !line.includes('日時') && line !== lineCandidate) || '不明店舗').trim()
  const category = (detailMatch?.[2] || inferCategory(store)).trim()
  const amount = Number((detailMatch?.[3] || amountMatch[1]).replace(/,/g, ''))
  const date = normalizeDate(dateMatch[1])

  if (!store || !amount || !date) return null

  return {
    date,
    store,
    amount,
    category
  }
}

function normalizeDate(raw) {
  const parts = raw.replace(/\//g, '-').split('-').map((p) => p.padStart(2, '0'))
  if (parts.length !== 3) return ''
  return `${parts[0]}-${parts[1]}-${parts[2]}`
}

function inferCategory(store) {
  if (/スーパー|mart|store/i.test(store)) return '食費'
  if (/lotteria|cafe|coffee|restaurant|食/i.test(store)) return '外食'
  if (/電車|バス|taxi|jr|交通/i.test(store)) return '交通'
  return '生活'
}

function getMonthRange(baseDate) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
  return { start: formatDateOnly(start), end: formatDateOnly(end) }
}

function isDateInRange(date, range) {
  return date >= range.start && date <= range.end
}

function sumAmount(list) {
  return list.reduce((acc, item) => acc + Number(item.amount), 0)
}

function buildMonthlyHistory(expenseList, incomeList) {
  const map = new Map()

  expenseList.forEach((row) => {
    const month = row.date.slice(0, 7)
    const item = map.get(month) || { month, income: 0, expense: 0, balance: 0 }
    item.expense += Number(row.amount)
    map.set(month, item)
  })

  incomeList.forEach((row) => {
    const month = row.date.slice(0, 7)
    const item = map.get(month) || { month, income: 0, expense: 0, balance: 0 }
    item.income += Number(row.amount)
    map.set(month, item)
  })

  return [...map.values()]
    .map((item) => ({ ...item, balance: item.income - item.expense }))
    .sort((a, b) => b.month.localeCompare(a.month))
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) {
    gmailScriptReady = true
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-gis="true"]')
    if (existing) {
      existing.addEventListener('load', () => {
        gmailScriptReady = true
        resolve()
      })
      existing.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.gis = 'true'
    script.onload = () => {
      gmailScriptReady = true
      resolve()
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function initializeTokenClient() {
  if (!gmailScriptReady || !gmailClientId.value.trim() || !window.google?.accounts?.oauth2) {
    gmailStatusText.value = '未接続'
    return
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: gmailClientId.value.trim(),
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    callback: (response) => {
      if (response.error) {
        gmailStatusText.value = '未接続'
        gmailConnected.value = false
        return
      }

      accessToken = response.access_token
      tokenExpiresAt = Date.now() + (response.expires_in || 3500) * 1000
      gmailConnected.value = true
      gmailStatusText.value = '接続中'
    }
  })
}

function ensureToken(interactive = true) {
  return new Promise((resolve) => {
    if (!tokenClient) {
      pushToast('warning', '⚠️ Google Client ID を設定してください')
      resolve(false)
      return
    }

    if (accessToken && Date.now() < tokenExpiresAt - 5000) {
      resolve(true)
      return
    }

    const originalCallback = tokenClient.callback
    tokenClient.callback = (response) => {
      originalCallback(response)
      if (response.error) {
        resolve(false)
      } else {
        resolve(true)
      }
    }

    tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' })
  })
}

function buildGmailQuery() {
  const keywords = gmailKeywords.value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  if (keywords.length === 0) {
    return 'subject:(ご利用のお知らせ OR クレジット)'
  }

  return `subject:(${keywords.join(' OR ')})`
}

async function importFromGmail(interactive = true) {
  isImporting.value = true
  try {
    const ok = await ensureToken(interactive)
    if (!ok) {
      if (interactive) pushToast('warning', '⚠️ Gmail認証に失敗しました')
      return
    }

    const query = buildGmailQuery()
    const messageList = await gmailApi(`users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`)
    const messages = messageList.messages || []

    if (messages.length === 0) {
      if (interactive) pushToast('warning', '⚠️ 対象メールが見つかりませんでした')
      return
    }

    const candidates = []

    for (const item of messages) {
      const detail = await gmailApi(`users/me/messages/${item.id}?format=full`)
      const text = [detail.snippet, extractBodyText(detail.payload)].filter(Boolean).join('\n')
      const parsed = parseExpenseText(text)
      if (!parsed) continue

      const duplicateByMail = importedMailIds.value.has(item.id)
      const duplicateByContent = isDuplicate(parsed)

      candidates.push({
        id: item.id,
        subject: getHeaderValue(detail.payload?.headers, 'Subject') || '(件名なし)',
        ...parsed,
        paymentMethod: 'credit',
        source: 'auto',
        isDuplicate: duplicateByMail || duplicateByContent,
        selected: !(duplicateByMail || duplicateByContent)
      })
    }

    if (candidates.length === 0) {
      if (interactive) pushToast('warning', '⚠️ 解析可能なメールがありませんでした')
      return
    }

    importCandidates.value = candidates
    importModalOpen.value = true
  } catch {
    if (interactive) pushToast('warning', '⚠️ Gmail取込に失敗しました')
  } finally {
    isImporting.value = false
  }
}

async function gmailApi(path) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!res.ok) {
    throw new Error('gmail api error')
  }
  return res.json()
}

function extractBodyText(payload) {
  if (!payload) return ''

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data)
  }

  if (!payload.parts) return ''

  const plain = payload.parts.find((p) => p.mimeType === 'text/plain' && p.body?.data)
  if (plain?.body?.data) {
    return decodeBase64Url(plain.body.data)
  }

  for (const part of payload.parts) {
    const nested = extractBodyText(part)
    if (nested) return nested
  }

  return ''
}

function decodeBase64Url(value) {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    return decodeURIComponent(
      decoded
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    )
  } catch {
    return ''
  }
}

function getHeaderValue(headers = [], key) {
  const found = headers.find((h) => h.name?.toLowerCase() === key.toLowerCase())
  return found?.value || ''
}

function registerSelectedImports() {
  const selected = importCandidates.value.filter((item) => item.selected)
  if (selected.length === 0) {
    pushToast('warning', '⚠️ 登録対象を選択してください')
    return
  }

  let added = 0
  let duplicates = 0

  selected.forEach((item) => {
    const payload = {
      date: item.date,
      store: item.store,
      amount: item.amount,
      category: item.category,
      paymentMethod: 'credit',
      source: 'auto',
      mailId: item.id
    }

    if (isDuplicate(payload) || importedMailIds.value.has(item.id)) {
      duplicates += 1
      return
    }

    records.value.push(createRecord(payload))
    importedMailIds.value.add(item.id)
    added += 1
  })

  localStorage.setItem(LS_KEYS.importedMailIds, JSON.stringify([...importedMailIds.value]))

  if (added > 0) {
    pushToast('success', `✅ 支出を登録しました（${added}件）`)
  }

  if (duplicates > 0) {
    pushToast('warning', '⚠️ 同じ内容がすでに登録されています')
  }

  importModalOpen.value = false
}

function setupAutoCheckTimer() {
  if (checkTimerId) {
    clearInterval(checkTimerId)
    checkTimerId = null
  }

  const intervalMs = {
    manual: 0,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  }[gmailCheckInterval.value]

  if (!intervalMs || gmailCheckInterval.value === 'manual') return

  checkTimerId = setInterval(() => {
    importFromGmail(false)
  }, intervalMs)
}
</script>

<template>
  <div class="app-shell">
    <header class="page-header">
      <h1>家計簿アプリ</h1>
      <p>メール貼り付け + Gmail API自動取込対応</p>
    </header>

    <nav class="tab-nav desktop-nav">
      <button
        v-for="item in VIEW_ITEMS"
        :key="item.id"
        type="button"
        :class="['tab-button', { active: activeView === item.id }]"
        @click="activeView = item.id"
      >
        {{ item.label }}
      </button>
    </nav>

    <section v-if="activeView === 'dashboard'" class="panel">
      <h2>今月のダッシュボード</h2>
      <div class="summary-card">
        <p>今月の支出合計</p>
        <div class="big-number">¥{{ formatAmount(currentMonthTotal) }}</div>
        <div class="month-diff" :class="monthDiff >= 0 ? 'up' : 'down'">
          <span>{{ monthDiff >= 0 ? '↑' : '↓' }}</span>
          <span>先月比 ¥{{ formatAmount(Math.abs(monthDiff)) }}</span>
        </div>
        <p class="income-note">今月収入: ¥{{ formatAmount(currentMonthIncomeTotal) }} / 収支: ¥{{ formatAmount(currentMonthBalance) }}</p>
      </div>

      <div class="split-grid">
        <div class="card">
          <h3>支払い方法別内訳</h3>
          <div v-if="paymentBreakdown.length === 0" class="empty">データがありません</div>
          <div v-for="item in paymentBreakdown" :key="item.method" class="progress-row">
            <div class="progress-label">{{ item.label }} (¥{{ formatAmount(item.amount) }})</div>
            <div class="progress-track">
              <div class="progress-bar" :style="{ width: `${item.ratio}%` }" />
            </div>
          </div>
        </div>

        <div class="card">
          <h3>カテゴリ別支出</h3>
          <div v-if="categoryBreakdown.length === 0" class="empty">データがありません</div>
          <div v-for="item in categoryBreakdown" :key="item.category" class="bar-row">
            <span>{{ item.category }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: `${item.width}%`, backgroundColor: item.color }" />
            </div>
            <span>¥{{ formatAmount(item.amount) }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>月次収支履歴（保存済み）</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>月</th>
                <th class="amount-col">収入</th>
                <th class="amount-col">支出</th>
                <th class="amount-col">収支</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in monthlyHistory" :key="row.month">
                <td>{{ row.month }}</td>
                <td class="amount-col">¥{{ formatAmount(row.income) }}</td>
                <td class="amount-col">¥{{ formatAmount(row.expense) }}</td>
                <td class="amount-col">¥{{ formatAmount(row.balance) }}</td>
              </tr>
              <tr v-if="monthlyHistory.length === 0">
                <td colspan="4" class="empty">履歴がありません</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-if="activeView === 'input'" class="panel">
      <h2>支出入力</h2>

      <div class="paste-card">
        <h3>📧 クレジットご利用通知を貼り付け</h3>
        <textarea
          v-model="emailText"
          class="email-textarea"
          rows="7"
          placeholder="ご利用日時：2026/03/08 09:45&#10;LOTTERIA（買物）  390円"
        />

        <div v-if="parsedEmail" class="parse-preview success-preview">
          <strong>解析成功</strong>
          <p>日付: {{ parsedEmail.date }}</p>
          <p>店舗: {{ parsedEmail.store }}</p>
          <p>金額: ¥{{ formatAmount(parsedEmail.amount) }}</p>
          <p>カテゴリ: {{ parsedEmail.category }}</p>
          <button type="button" class="primary" @click="registerParsedExpense">解析結果を登録</button>
        </div>

        <div v-else-if="parseError" class="parse-preview error-preview">
          {{ parseError }}
        </div>
      </div>

      <div class="actions-row">
        <button type="button" class="secondary" :disabled="isImporting" @click="importFromGmail(true)">
          {{ isImporting ? '取込中...' : 'メールを取り込む' }}
        </button>
      </div>

      <div class="card">
        <h3>手動入力</h3>
        <div class="form-grid">
          <label>
            日付
            <input v-model="manualForm.date" type="date" />
          </label>
          <label>
            店舗
            <input v-model="manualForm.store" type="text" placeholder="例: スーパー" />
          </label>
          <label>
            金額
            <input v-model="manualForm.amount" type="number" placeholder="1000" />
          </label>
          <label>
            カテゴリ
            <input v-model="manualForm.category" type="text" placeholder="食費" />
          </label>
          <label>
            支払い方法
            <select v-model="manualForm.paymentMethod">
              <option value="cash">現金</option>
              <option value="paypay">PayPay</option>
              <option value="credit">クレジット</option>
              <option value="bank">口座振替</option>
            </select>
          </label>
        </div>
        <button type="button" class="primary" @click="registerManualExpense">手動で登録</button>
      </div>

      <div class="card">
        <h3>収入入力（手動）</h3>
        <div class="form-grid">
          <label>
            日付
            <input v-model="incomeForm.date" type="date" />
          </label>
          <label>
            収入元
            <input v-model="incomeForm.source" type="text" placeholder="例: 給与" />
          </label>
          <label>
            金額
            <input v-model="incomeForm.amount" type="number" placeholder="250000" />
          </label>
        </div>
        <button type="button" class="primary" @click="registerIncome">収入を登録</button>
      </div>
    </section>

    <section v-if="activeView === 'records'" class="panel">
      <h2>支出一覧</h2>
      <div class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>日付</th>
              <th>店舗</th>
              <th>カテゴリ</th>
              <th>区分</th>
              <th class="amount-col">金額</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in sortedRecords" :key="row.id">
              <td>{{ row.date }}</td>
              <td>{{ row.store }}</td>
              <td>{{ row.category }}</td>
              <td>
                <span :class="['badge', sourceClass(row.source)]">{{ sourceLabel(row.source) }}</span>
              </td>
              <td class="amount-col">¥{{ formatAmount(row.amount) }}</td>
              <td>
                <button type="button" class="danger-text" @click="askDelete(row)">削除</button>
              </td>
            </tr>
            <tr v-if="sortedRecords.length === 0">
              <td colspan="6" class="empty">登録データがありません</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="activeView === 'settings'" class="panel">
      <h2>Gmail連携設定</h2>
      <div class="card form-grid">
        <label>
          Google Client ID
          <input v-model="gmailClientId" type="text" placeholder="xxxxxxxx.apps.googleusercontent.com" />
        </label>
        <label>
          自動チェック間隔
          <select v-model="gmailCheckInterval">
            <option value="manual">手動</option>
            <option value="15m">15分</option>
            <option value="1h">1時間</option>
            <option value="1d">1日</option>
          </select>
        </label>
        <label>
          検索件名キーワード（カンマ区切り）
          <input v-model="gmailKeywords" type="text" />
        </label>
        <label>
          連携ステータス
          <input :value="gmailStatusText" type="text" readonly />
        </label>
      </div>
      <button type="button" class="secondary" @click="importFromGmail(true)">認証して取り込む</button>
    </section>

    <section v-if="activeView === 'help'" class="panel">
      <h2>Gmail API セットアップ手順</h2>
      <div class="card help-card">
        <ol>
          <li>Google Cloud Consoleで新規プロジェクトを作成します。</li>
          <li>「Gmail API」を有効化します。</li>
          <li>OAuth同意画面を作成し、テストユーザーを追加します。</li>
          <li>「OAuth クライアントID（ウェブ）」を作成し、承認済みJavaScript生成元にこのアプリのURLを登録します。</li>
          <li>発行されたClient IDを設定画面に貼り付けます。</li>
          <li>入力画面の「メールを取り込む」ボタンから認証し、取込候補を一括登録します。</li>
        </ol>
        <p>注意: Client IDはこのブラウザのlocalStorageに保存されます。</p>
      </div>
    </section>

    <nav class="mobile-nav">
      <button
        v-for="item in VIEW_ITEMS"
        :key="item.id"
        type="button"
        :class="['tab-button', { active: activeView === item.id }]"
        @click="activeView = item.id"
      >
        {{ item.label }}
      </button>
    </nav>

    <div v-if="deleteTarget" class="modal-backdrop">
      <div class="modal-card">
        <h3>削除確認</h3>
        <p>{{ deleteTarget.date }} {{ deleteTarget.store }} ¥{{ formatAmount(deleteTarget.amount) }} を削除しますか？</p>
        <div class="modal-actions">
          <button type="button" class="secondary" @click="cancelDelete">キャンセル</button>
          <button type="button" class="danger" @click="confirmDelete">削除する</button>
        </div>
      </div>
    </div>

    <div v-if="importModalOpen" class="modal-backdrop">
      <div class="modal-card wide">
        <h3>Gmail取込結果</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>選択</th>
                <th>日付</th>
                <th>店舗</th>
                <th>カテゴリ</th>
                <th class="amount-col">金額</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in importCandidates" :key="row.id">
                <td><input v-model="row.selected" type="checkbox" :disabled="row.isDuplicate" /></td>
                <td>{{ row.date }}</td>
                <td>{{ row.store }}</td>
                <td>{{ row.category }}</td>
                <td class="amount-col">¥{{ formatAmount(row.amount) }}</td>
                <td>{{ row.isDuplicate ? '重複' : '新規' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-actions">
          <button type="button" class="secondary" @click="importModalOpen = false">閉じる</button>
          <button type="button" class="primary" @click="registerSelectedImports">一括登録</button>
        </div>
      </div>
    </div>

    <div class="toast-wrap">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>
