<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStocks } from '@/composables/useStocks'
import { useHousehold } from '@/composables/useHousehold'
import { useSecuritiesAccounts } from '@/composables/useSecuritiesAccounts'

const {
  stocks,
  loading,
  updatingPrices,
  updateErrors,
  syncingSheet,
  sheetLoading,
  sheetError,
  sheetRows,
  totalEvaluationAmount,
  fetchStocks,
  fetchSheetRows,
  addStock,
  deleteStock,
  updateFundPrice,
  updatePrices,
} = useStocks()

const { currentHouseholdId } = useHousehold()
const { activeSecuritiesAccounts } = useSecuritiesAccounts(() => currentHouseholdId.value)

const formError = ref('')
const symbolInput = ref('')
const nameInput = ref('')
const typeInput = ref<'stock' | 'fund'>('stock')
const accountTypeInput = ref('')
const quantityInput = ref<number | undefined>(undefined)
const averagePriceInput = ref<number | undefined>(undefined)
const currentPriceInput = ref<number | undefined>(undefined)
const evaluationAmountInput = ref<number | undefined>(undefined)
const showAddModal = ref(false)
const fundPriceInputs = ref<Record<string, number>>({})
const fundEvaluationInputs = ref<Record<string, number>>({})
const expandedRows = ref<Record<string, boolean>>({})
const usdJpyRate = ref(150)

let autoTimer: number | null = null

const stockCandidates = [
  { symbol: 'NVDA', name: 'エヌビディア', type: 'stock' as const },
  { symbol: 'AAPL', name: 'アップル', type: 'stock' as const },
  { symbol: 'MSFT', name: 'マイクロソフト', type: 'stock' as const },
  { symbol: 'KO', name: 'コカ・コーラ', type: 'stock' as const },
  { symbol: 'MU', name: 'マイクロン・テクノロジー', type: 'stock' as const },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'stock' as const },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'stock' as const },
  { symbol: '楽天・全米株式インデックス・ファンド(楽天・VTI)', name: '楽天・全米株式インデックス・ファンド(楽天・VTI)', type: 'fund' as const },
  { symbol: 'eMAXIS Slim 先進国株式インデックス(除く日本)', name: 'eMAXIS Slim 先進国株式インデックス(除く日本)', type: 'fund' as const },
  { symbol: 'eMAXIS Slim 全世界株式(オール・カントリー)', name: 'eMAXIS Slim 全世界株式(オール・カントリー)', type: 'fund' as const },
  { symbol: '楽天・オールカントリー株式インデックス・ファンド', name: '楽天・オールカントリー株式インデックス・ファンド', type: 'fund' as const },
]

const filteredCandidates = computed(() => {
  const keyword = `${symbolInput.value} ${nameInput.value}`.trim().toLowerCase()
  if (!keyword) return stockCandidates.slice(0, 8)
  return stockCandidates
    .filter((item) =>
      item.symbol.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword),
    )
    .slice(0, 8)
})

const totalProfitLoss = computed(() =>
  stocks.value.reduce((sum, row) => sum + Number(row.profit_loss ?? 0), 0),
)

const totalProfitLossRate = computed(() => {
  const costTotal = stocks.value.reduce((sum, row) => sum + (Number(row.average_price ?? 0) * Number(row.quantity ?? 0)), 0)
  if (costTotal <= 0) return 0
  return (totalProfitLoss.value / costTotal) * 100
})

const stockRows = computed(() => stocks.value.filter((row) => row.type === 'stock'))
const fundRows = computed(() => stocks.value.filter((row) => row.type === 'fund'))

const lastUpdatedLabel = computed(() => {
  if (stocks.value.length === 0) return '未更新'
  const latest = stocks.value.reduce((acc, row) => {
    const ts = row.updated_at ? new Date(row.updated_at).getTime() : 0
    return Math.max(acc, ts)
  }, 0)
  if (!latest) return '未更新'
  return new Date(latest).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})

function selectCandidate(candidate: { symbol: string; name: string; type: 'stock' | 'fund' }) {
  symbolInput.value = candidate.symbol
  nameInput.value = candidate.name
  typeInput.value = candidate.type
}

function quantityUnit(type: 'stock' | 'fund') {
  return type === 'stock' ? '株' : '口'
}

function formatNumber(value: number, fractionDigits = 2) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })
}

function profitClass(value: number) {
  if (value > 0) return 'stocks-view__profit--plus'
  if (value < 0) return 'stocks-view__profit--minus'
  return ''
}

function currentValueText(type: 'stock' | 'fund', value: number) {
  return type === 'stock'
    ? `${formatNumber(Number(value) * Number(usdJpyRate.value), 0)}円 (${formatNumber(Number(value), 2)}USドル)`
    : `${formatNumber(Number(value), 2)}円`
}

function toggleDetail(id: string) {
  expandedRows.value[id] = !expandedRows.value[id]
}

function isDetailOpen(id: string) {
  return Boolean(expandedRows.value[id])
}

function syncFundPriceInputs() {
  const nextPrice: Record<string, number> = {}
  const nextEval: Record<string, number> = {}
  for (const row of fundRows.value) {
    nextPrice[row.id] = Number(row.current_price ?? 0)
    nextEval[row.id] = Number(row.evaluation_amount ?? 0)
  }
  fundPriceInputs.value = nextPrice
  fundEvaluationInputs.value = nextEval
}

async function handleAddInvestment() {
  formError.value = ''

  if (!symbolInput.value.trim()) {
    formError.value = '銘柄コードを入力してください。'
    return
  }
  if (!nameInput.value.trim()) {
    formError.value = '銘柄名を入力してください。'
    return
  }
  if (typeInput.value === 'fund' && !(Number(evaluationAmountInput.value ?? 0) > 0)) {
    formError.value = '投資信託は評価額を入力してください。'
    return
  }

  try {
    await addStock({
      symbol: symbolInput.value,
      name: nameInput.value,
      type: typeInput.value,
      account_type: accountTypeInput.value || '未設定',
      quantity: quantityInput.value ?? 0,
      average_price: averagePriceInput.value ?? 0,
      current_price: typeInput.value === 'fund' ? (currentPriceInput.value ?? averagePriceInput.value ?? 0) : undefined,
      evaluation_amount: typeInput.value === 'fund' ? (evaluationAmountInput.value ?? 0) : undefined,
    })

    symbolInput.value = ''
    nameInput.value = ''
    typeInput.value = 'stock'
    accountTypeInput.value = ''
    quantityInput.value = undefined
    averagePriceInput.value = undefined
    currentPriceInput.value = undefined
    evaluationAmountInput.value = undefined
    showAddModal.value = false
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '登録に失敗しました。'
  }
}

function onSelectSecuritiesAccount(accountId: string) {
  const account = activeSecuritiesAccounts.value.find((v) => v.id === accountId)
  if (!account) return
  const taxLabel = account.tax_category === 'nisa_growth'
    ? 'NISA 成長投資枠'
    : account.tax_category === 'nisa_tsumitate'
      ? 'NISA つみたて投資枠'
      : account.tax_category === 'specified'
        ? '特定口座'
        : '一般口座'
  accountTypeInput.value = `${account.broker_name} / ${taxLabel}`
}

async function handleUpdatePrices() {
  formError.value = ''
  try {
    await updatePrices(usdJpyRate.value)
  } catch (error) {
    formError.value = error instanceof Error
      ? `価格同期に失敗しました。(${error.message})`
      : '価格同期に失敗しました。'
  }
}

async function handleDelete(id: string) {
  if (!confirm('この銘柄を削除しますか？')) return
  try {
    await deleteStock(id)
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '削除に失敗しました。'
  }
}

async function handleSaveFundPrice(id: string) {
  formError.value = ''
  try {
    await updateFundPrice(
      id,
      fundPriceInputs.value[id] ?? 0,
      fundEvaluationInputs.value[id] ?? 0,
    )
    syncFundPriceInputs()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '投資信託価格の保存に失敗しました。'
  }
}

function handleFetchSheetRows() {
  void fetchSheetRows('all')
}

onMounted(() => {
  void fetchStocks()
  autoTimer = window.setInterval(() => {
    void handleUpdatePrices()
  }, 5 * 60 * 1000)
})

onBeforeUnmount(() => {
  if (autoTimer !== null) {
    window.clearInterval(autoTimer)
  }
})

watch(
  fundRows,
  () => {
    syncFundPriceInputs()
  },
  { immediate: true },
)
</script>

<template>
  <main class="stocks-view">
    <section class="stocks-view__summary card">
      <h2 class="stocks-view__title">投資（個別株・投資信託）</h2>
      <p class="stocks-view__summary-value">評価額合計: {{ formatNumber(totalEvaluationAmount, 0) }} 円</p>
      <p class="stocks-view__summary-sub">評価損益合計: <span :class="profitClass(totalProfitLoss)">{{ formatNumber(totalProfitLoss, 0) }} 円</span></p>
      <p class="stocks-view__summary-sub">評価損益率合計: <span :class="profitClass(totalProfitLossRate)">{{ formatNumber(totalProfitLossRate, 2) }}%</span></p>
      <label class="stocks-view__fx-input">
        <span>USD/JPY</span>
        <input v-model.number="usdJpyRate" type="number" min="1" step="0.01" />
      </label>
      <button class="stocks-view__update-btn" :disabled="updatingPrices" @click="handleUpdatePrices">
        {{ updatingPrices ? '更新中...' : '価格更新（Google Sheets）' }}
      </button>
      <p class="stocks-view__summary-sub">最終更新: {{ lastUpdatedLabel }}</p>
      <ul v-if="updateErrors.length > 0" class="stocks-view__errors">
        <li v-for="err in updateErrors" :key="err">{{ err }}</li>
      </ul>
      <p v-if="formError" class="stocks-view__error">{{ formError }}</p>
    </section>

    <section class="card stocks-view__register">
      <h3 style="margin: 0;">投資銘柄登録</h3>
      <button type="button" @click="showAddModal = true">登録</button>
    </section>

    <section class="card stocks-view__table-wrap">
      <div class="stocks-view__sheet-head">
        <h3 style="margin: 0;">Google Sheets 連携データ</h3>
        <button :disabled="sheetLoading" @click="handleFetchSheetRows">
          {{ sheetLoading ? '取得中...' : '再取得' }}
        </button>
      </div>
      <p v-if="syncingSheet" class="stocks-view__sheet-meta">Sheetsに同期中...</p>
      <p v-if="sheetError" class="stocks-view__error">{{ sheetError }}</p>
      <p v-if="sheetLoading">読み込み中...</p>
      <p v-else-if="sheetRows.length === 0">Sheetsにデータがありません。</p>
      <table v-else class="stocks-view__table">
        <thead>
          <tr>
            <th>銘柄コード</th>
            <th>銘柄名</th>
            <th>保有数</th>
            <th>現在価格</th>
            <th>評価額</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in sheetRows" :key="`${row.symbol}-${idx}`">
            <td>{{ row.symbol }}</td>
            <td>{{ row.name }}</td>
            <td>{{ formatNumber(Number(row.quantity), 4) }}</td>
            <td>{{ formatNumber(Number(row.currentPrice), 2) }}</td>
            <td>{{ formatNumber(Number(row.evaluationAmount), 0) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="showAddModal" class="stocks-view__modal-overlay" @click.self="showAddModal = false">
      <section class="stocks-view__modal card">
        <h3 style="margin-top: 0;">銘柄追加</h3>
        <form class="stocks-view__form" @submit.prevent="handleAddInvestment">
          <select v-model="typeInput" required>
            <option value="stock">個別株（株）</option>
            <option value="fund">投資信託・ETF（口）</option>
          </select>
          <input v-model="symbolInput" type="text" placeholder="銘柄コード（例: NVDA）" required />
          <input v-model="nameInput" type="text" placeholder="銘柄名（例: 楽天・全米株式インデックス・ファンド）" required />
          <ul v-if="filteredCandidates.length > 0" class="stocks-view__suggestions">
            <li
              v-for="candidate in filteredCandidates"
              :key="`${candidate.type}-${candidate.symbol}`"
              class="stocks-view__suggestion-item"
              @click="selectCandidate(candidate)"
            >
              {{ candidate.name }}
            </li>
          </ul>
          <select @change="onSelectSecuritiesAccount(($event.target as HTMLSelectElement).value)">
            <option value="">証券口座から設定（任意）</option>
            <option v-for="acc in activeSecuritiesAccounts" :key="acc.id" :value="acc.id">
              {{ acc.broker_name }} / {{ acc.account_name }}
            </option>
          </select>
          <input v-model="accountTypeInput" type="text" placeholder="口座区分（例: NISA 成長投資枠）" required />
          <input
            v-model.number="quantityInput"
            type="number"
            step="0.0001"
            min="0"
            :placeholder="`保有数量（${quantityUnit(typeInput)}）`"
            required
          />
          <input v-model.number="averagePriceInput" type="number" step="0.0001" min="0" placeholder="平均取得価額" required />
          <input
            v-if="typeInput === 'fund'"
            v-model.number="currentPriceInput"
            type="number"
            step="0.0001"
            min="0"
            placeholder="現在価格（投資信託/ETFは手動）"
          />
          <input
            v-if="typeInput === 'fund'"
            v-model.number="evaluationAmountInput"
            type="number"
            step="1"
            min="0"
            placeholder="評価額（投資信託/ETFは手動）"
            required
          />
          <div style="display: flex; gap: 0.5rem;">
            <button type="submit">登録する</button>
            <button type="button" @click="showAddModal = false">閉じる</button>
          </div>
        </form>
      </section>
    </div>

    <section class="card stocks-view__table-wrap">
      <h3 style="margin-top: 0;">株式</h3>
      <p v-if="loading">読み込み中...</p>
      <p v-else-if="stockRows.length === 0">株式はありません。</p>
      <ul v-else class="stocks-view__item-list">
        <li v-for="row in stockRows" :key="row.id" class="stocks-view__item card">
          <div class="stocks-view__item-top">
            <div>
              <p class="stocks-view__item-name">{{ row.name }}</p>
              <p class="stocks-view__item-sub">{{ row.symbol }}</p>
            </div>
            <button type="button" @click="toggleDetail(row.id)">
              {{ isDetailOpen(row.id) ? '閉じる' : '詳細' }}
            </button>
          </div>
          <div class="stocks-view__item-main">
            <div>
              <p class="stocks-view__metric-label">現在価格</p>
              <p class="stocks-view__metric-value">{{ currentValueText(row.type, Number(row.current_price)) }}</p>
            </div>
            <div>
              <p class="stocks-view__metric-label">評価損益率</p>
              <p class="stocks-view__metric-value" :class="profitClass(Number(row.profit_loss_rate))">
                {{ formatNumber(Number(row.profit_loss_rate), 2) }}%
              </p>
            </div>
          </div>
          <div v-if="isDetailOpen(row.id)" class="stocks-view__detail">
            <div class="stocks-view__detail-grid">
              <div>
                <p class="stocks-view__detail-label">銘柄</p>
                <p>{{ row.name }} / {{ row.symbol }}</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">口座区分</p>
                <p>{{ row.account_type }}</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">保有数量</p>
                <p>{{ formatNumber(Number(row.quantity), 4) }}{{ quantityUnit(row.type) }}</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">平均取得価額</p>
                <p>{{ formatNumber(Number(row.average_price), 2) }}円</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">現在値</p>
                <p>{{ currentValueText(row.type, Number(row.current_price)) }}</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">評価額</p>
                <p>{{ formatNumber(Number(row.evaluation_amount), 0) }}円</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">評価損益</p>
                <p :class="profitClass(Number(row.profit_loss))">{{ formatNumber(Number(row.profit_loss), 0) }}円</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">評価損益率</p>
                <p :class="profitClass(Number(row.profit_loss_rate))">{{ formatNumber(Number(row.profit_loss_rate), 2) }}%</p>
              </div>
            </div>
            <div class="stocks-view__trade-row">
              <span class="stocks-view__detail-label">取引</span>
              <div class="stocks-view__trade-badges">
                <span class="stocks-view__badge">買い</span>
                <span class="stocks-view__badge">積立</span>
                <span class="stocks-view__badge">売り</span>
              </div>
            </div>
            <button type="button" class="stocks-view__danger-btn" @click="handleDelete(row.id)">削除</button>
          </div>
        </li>
      </ul>
    </section>

    <section class="card stocks-view__table-wrap">
      <h3 style="margin-top: 0;">投資信託</h3>
      <p v-if="loading">読み込み中...</p>
      <p v-else-if="fundRows.length === 0">投資信託はありません。</p>
      <ul v-else class="stocks-view__item-list">
        <li v-for="row in fundRows" :key="row.id" class="stocks-view__item card">
          <div class="stocks-view__item-top">
            <div>
              <p class="stocks-view__item-name">{{ row.name }}</p>
              <p class="stocks-view__item-sub">{{ row.symbol }}</p>
            </div>
            <button type="button" @click="toggleDetail(row.id)">
              {{ isDetailOpen(row.id) ? '閉じる' : '詳細' }}
            </button>
          </div>
          <div class="stocks-view__item-main">
            <div>
              <p class="stocks-view__metric-label">現在価格</p>
              <p class="stocks-view__metric-value">{{ currentValueText(row.type, Number(row.current_price)) }}</p>
            </div>
            <div>
              <p class="stocks-view__metric-label">評価損益率</p>
              <p class="stocks-view__metric-value" :class="profitClass(Number(row.profit_loss_rate))">
                {{ formatNumber(Number(row.profit_loss_rate), 2) }}%
              </p>
            </div>
          </div>
          <div v-if="isDetailOpen(row.id)" class="stocks-view__detail">
            <div class="stocks-view__detail-grid">
              <div>
                <p class="stocks-view__detail-label">銘柄</p>
                <p>{{ row.name }} / {{ row.symbol }}</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">口座区分</p>
                <p>{{ row.account_type }}</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">保有数量</p>
                <p>{{ formatNumber(Number(row.quantity), 4) }}{{ quantityUnit(row.type) }}</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">平均取得価額</p>
                <p>{{ formatNumber(Number(row.average_price), 2) }}円</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">現在値</p>
                <p>{{ currentValueText(row.type, Number(row.current_price)) }}</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">評価額</p>
                <p>{{ formatNumber(Number(row.evaluation_amount), 0) }}円</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">評価損益</p>
                <p :class="profitClass(Number(row.profit_loss))">{{ formatNumber(Number(row.profit_loss), 0) }}円</p>
              </div>
              <div>
                <p class="stocks-view__detail-label">評価損益率</p>
                <p :class="profitClass(Number(row.profit_loss_rate))">{{ formatNumber(Number(row.profit_loss_rate), 2) }}%</p>
              </div>
            </div>
            <div class="stocks-view__fund-edit">
              <label>
                <span class="stocks-view__detail-label">現在価格（円）</span>
                <input v-model.number="fundPriceInputs[row.id]" type="number" step="0.0001" min="0" />
              </label>
              <label>
                <span class="stocks-view__detail-label">評価額（円）</span>
                <input v-model.number="fundEvaluationInputs[row.id]" type="number" step="1" min="0" />
              </label>
              <button type="button" @click="handleSaveFundPrice(row.id)">保存</button>
            </div>
            <div class="stocks-view__trade-row">
              <span class="stocks-view__detail-label">取引</span>
              <div class="stocks-view__trade-badges">
                <span class="stocks-view__badge">買い</span>
                <span class="stocks-view__badge">積立</span>
                <span class="stocks-view__badge">売り</span>
              </div>
            </div>
            <button type="button" class="stocks-view__danger-btn" @click="handleDelete(row.id)">削除</button>
          </div>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.stocks-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.stocks-view__summary {
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
  color: #fff;
}

.stocks-view__title {
  margin: 0;
  font-size: 1.1rem;
}

.stocks-view__summary-value {
  margin: 0.5rem 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.stocks-view__summary-sub {
  margin: 0.2rem 0;
  font-size: 0.95rem;
}

.stocks-view__fx-input {
  margin-top: 0.4rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.stocks-view__fx-input input {
  width: 110px;
}

.stocks-view__update-btn {
  background: #ffffff;
  color: #0f766e;
  font-weight: 700;
}

.stocks-view__errors,
.stocks-view__error {
  margin: 0.75rem 0 0 0;
  font-size: 0.85rem;
}

.stocks-view__error {
  color: #fecaca;
}

.stocks-view__form {
  display: grid;
  gap: 0.5rem;
}

.stocks-view__register {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stocks-view__modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.stocks-view__modal {
  width: min(560px, 100%);
}

.stocks-view__suggestions {
  list-style: none;
  margin: -0.1rem 0 0;
  padding: 0.2rem;
  border: 1px solid #dbe1ea;
  border-radius: 10px;
  background: #fff;
  max-height: 180px;
  overflow: auto;
}

.stocks-view__suggestion-item {
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  cursor: pointer;
  color: #1f2937;
}

.stocks-view__suggestion-item:hover {
  background: #eef2ff;
}

.stocks-view__table-wrap {
  overflow: hidden;
}

.stocks-view__sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.stocks-view__sheet-meta {
  margin: 0 0 0.4rem 0;
  font-size: 0.9rem;
}

.stocks-view__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 0;
}

.stocks-view__table th,
.stocks-view__table td {
  border-bottom: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: right;
  white-space: nowrap;
}

.stocks-view__table th:nth-child(1),
.stocks-view__table td:nth-child(1),
.stocks-view__table th:nth-child(2),
.stocks-view__table td:nth-child(2) {
  text-align: left;
}

.stocks-view__profit--plus {
  color: #dc2626;
  font-weight: 700;
}

.stocks-view__profit--minus {
  color: #2563eb;
  font-weight: 700;
}

.stocks-view__fund-price-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.35rem;
}

.stocks-view__fund-price-cell input {
  width: 120px;
}

.stocks-view__item-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.stocks-view__item {
  border: 1px solid #e5e7eb;
}

.stocks-view__item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.stocks-view__item-name {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
}

.stocks-view__item-sub {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: #64748b;
}

.stocks-view__item-main {
  margin-top: 0.75rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.stocks-view__metric-label {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.stocks-view__metric-value {
  margin: 0.2rem 0 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
}

.stocks-view__detail {
  margin-top: 0.8rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.65rem;
  display: grid;
  gap: 0.35rem;
}

.stocks-view__detail p {
  margin: 0;
  font-size: 0.92rem;
}

.stocks-view__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem 0.75rem;
}

.stocks-view__detail-label {
  margin: 0;
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 700;
}

.stocks-view__trade-row {
  margin-top: 0.35rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.stocks-view__trade-badges {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.stocks-view__badge {
  font-size: 0.78rem;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #1e3a8a;
}

.stocks-view__fund-edit {
  margin-top: 0.55rem;
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
  align-items: end;
}

.stocks-view__fund-edit label {
  display: grid;
  gap: 0.25rem;
}

@media (max-width: 640px) {
  .stocks-view__detail-grid {
    grid-template-columns: 1fr;
  }

  .stocks-view__fund-edit {
    grid-template-columns: 1fr;
  }
}

.stocks-view__danger-btn {
  width: fit-content;
  margin-top: 0.35rem;
  background: #dc2626;
}
</style>
