<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStocks } from '@/composables/useStocks'
import { useHousehold } from '@/composables/useHousehold'
import { useSecuritiesAccounts } from '@/composables/useSecuritiesAccounts'

const {
  stocks,
  loading,
  updatingPrices,
  updateErrors,
  totalEvaluationAmount,
  fetchStocks,
  addStock,
  deleteStock,
  updatePrices,
} = useStocks()
const { currentHouseholdId } = useHousehold()
const { activeSecuritiesAccounts } = useSecuritiesAccounts(() => currentHouseholdId.value)

const formError = ref('')
const symbolInput = ref('')
const securitiesAccountIdInput = ref('')
const sharesInput = ref<number | undefined>(undefined)
const averagePriceInput = ref<number | undefined>(undefined)
const showAddModal = ref(false)

const stockCandidates = [
  { symbol: 'NVDA', name: 'エヌビディア' },
  { symbol: 'AAPL', name: 'アップル' },
  { symbol: 'MSFT', name: 'マイクロソフト' },
  { symbol: 'GOOGL', name: 'アルファベット' },
  { symbol: 'AMZN', name: 'アマゾン' },
  { symbol: 'META', name: 'メタ・プラットフォームズ' },
  { symbol: 'TSLA', name: 'テスラ' },
  { symbol: 'KO', name: 'コカ・コーラ' },
  { symbol: 'MU', name: 'マイクロン・テクノロジー' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
  { symbol: 'VT', name: 'Vanguard Total World Stock ETF' },
  { symbol: '楽天・全米株式インデックス・ファンド(楽天・VTI)', name: '投資信託' },
  { symbol: 'eMAXIS Slim 先進国株式インデックス(除く日本)', name: '投資信託' },
  { symbol: 'eMAXIS Slim 全世界株式(オール・カントリー)', name: '投資信託' },
  { symbol: '楽天・オールカントリー株式インデックス・ファンド', name: '投資信託' },
]

const filteredStockCandidates = computed(() => {
  const keyword = symbolInput.value.trim().toLowerCase()
  if (!keyword) return stockCandidates.slice(0, 8)
  return stockCandidates
    .filter((item) =>
      item.symbol.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword),
    )
    .slice(0, 8)
})

function selectStockCandidate(symbol: string) {
  symbolInput.value = symbol
}

const tableRows = computed(() =>
  stocks.value.map((stock) => ({
    id: stock.id,
    tradeLabel: '現物',
    symbol: stock.symbol,
    accountType: stock.account_type,
    securitiesAccountId: stock.securities_account_id,
    shares: Number(stock.shares ?? 0),
    averagePrice: Number(stock.average_price ?? 0),
    currentPrice: Number(stock.current_price ?? 0),
    evaluationAmount: Number(stock.evaluation_amount ?? 0),
    profitLoss: Number(stock.profit_loss ?? 0),
    profitLossRate: Number(stock.profit_loss_rate ?? 0),
  })),
)

const taxCategoryLabel: Record<string, string> = {
  nisa_growth: 'NISA 成長投資枠',
  nisa_tsumitate: 'NISA つみたて投資枠',
  specified: '特定口座',
  general: '一般口座',
}

function resolveAccountLabel(row: { accountType: string; securitiesAccountId: string | null }) {
  if (!row.securitiesAccountId) return row.accountType
  const account = activeSecuritiesAccounts.value.find((v) => v.id === row.securitiesAccountId)
  if (!account) return row.accountType
  return `${account.broker_name} / ${taxCategoryLabel[account.tax_category] ?? account.tax_category}`
}

const totalProfitLoss = computed(() =>
  tableRows.value.reduce((sum, row) => sum + row.profitLoss, 0),
)

const totalProfitLossRate = computed(() => {
  const costTotal = tableRows.value.reduce((sum, row) => sum + (row.averagePrice * row.shares), 0)
  if (costTotal <= 0) return 0
  return (totalProfitLoss.value / costTotal) * 100
})

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

async function handleAddStock() {
  formError.value = ''

  if (!symbolInput.value.trim()) {
    formError.value = '銘柄を入力してください。'
    return
  }

  try {
    const selectedAccount = activeSecuritiesAccounts.value.find((v) => v.id === securitiesAccountIdInput.value)
    await addStock({
      symbol: symbolInput.value,
      account_type: selectedAccount
        ? `${selectedAccount.broker_name} / ${taxCategoryLabel[selectedAccount.tax_category] ?? selectedAccount.tax_category}`
        : '未設定',
      securities_account_id: selectedAccount?.id ?? null,
      shares: sharesInput.value ?? 0,
      average_price: averagePriceInput.value ?? 0,
    })
    symbolInput.value = ''
    securitiesAccountIdInput.value = ''
    sharesInput.value = undefined
    averagePriceInput.value = undefined
    showAddModal.value = false
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '銘柄の追加に失敗しました。'
  }
}

async function handleUpdatePrices() {
  formError.value = ''
  try {
    await updatePrices()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '価格更新に失敗しました。'
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

onMounted(() => {
  void fetchStocks()
})
</script>

<template>
  <main class="stocks-view">
    <section class="stocks-view__summary card">
      <h2 class="stocks-view__title">個別株ポートフォリオ</h2>
      <p class="stocks-view__summary-value">評価額合計: {{ formatNumber(totalEvaluationAmount, 0) }} 円</p>
      <p class="stocks-view__summary-sub">評価損益合計: <span :class="profitClass(totalProfitLoss)">{{ formatNumber(totalProfitLoss, 0) }} 円</span></p>
      <p class="stocks-view__summary-sub">評価損益率合計: <span :class="profitClass(totalProfitLossRate)">{{ formatNumber(totalProfitLossRate, 2) }}%</span></p>
      <button class="stocks-view__update-btn" :disabled="updatingPrices" @click="handleUpdatePrices">
        {{ updatingPrices ? '更新中...' : '価格更新' }}
      </button>
      <ul v-if="updateErrors.length > 0" class="stocks-view__errors">
        <li v-for="err in updateErrors" :key="err">{{ err }}</li>
      </ul>
      <p v-if="formError" class="stocks-view__error">{{ formError }}</p>
    </section>

    <section class="card stocks-view__register">
      <h3 style="margin: 0;">株式登録</h3>
      <button type="button" @click="showAddModal = true">登録</button>
    </section>

    <div v-if="showAddModal" class="stocks-view__modal-overlay" @click.self="showAddModal = false">
      <section class="stocks-view__modal card">
        <h3 style="margin-top: 0;">銘柄追加</h3>
        <form class="stocks-view__form" @submit.prevent="handleAddStock">
          <input v-model="symbolInput" type="text" placeholder="銘柄コード/銘柄名（例: AAPL, 楽天・全米株式インデックス・ファンド）" required />
          <ul v-if="filteredStockCandidates.length > 0" class="stocks-view__suggestions">
            <li
              v-for="candidate in filteredStockCandidates"
              :key="candidate.symbol"
              class="stocks-view__suggestion-item"
              @click="selectStockCandidate(candidate.symbol)"
            >
              {{ candidate.symbol }} / {{ candidate.name }}
            </li>
          </ul>
          <select v-model="securitiesAccountIdInput" required>
            <option value="">証券口座を選択（NISA/特定）</option>
            <option v-for="acc in activeSecuritiesAccounts" :key="acc.id" :value="acc.id">
              {{ acc.broker_name }} / {{ taxCategoryLabel[acc.tax_category] }}
            </option>
          </select>
          <input v-model.number="sharesInput" type="number" step="0.0001" min="0" placeholder="保有数量" required />
          <input v-model.number="averagePriceInput" type="number" step="0.0001" min="0" placeholder="平均取得価額" required />
          <div style="display: flex; gap: 0.5rem;">
            <button type="submit">登録する</button>
            <button type="button" @click="showAddModal = false">閉じる</button>
          </div>
        </form>
      </section>
    </div>

    <section class="card stocks-view__table-wrap">
      <h3 style="margin-top: 0;">保有一覧</h3>
      <p v-if="loading">読み込み中...</p>
      <p v-else-if="tableRows.length === 0">銘柄がありません。</p>

      <table v-else class="stocks-view__table">
        <thead>
          <tr>
            <th>取引</th>
            <th>銘柄</th>
            <th>口座区分</th>
            <th>保有数量</th>
            <th>平均取得価額</th>
            <th>基準価額</th>
            <th>評価額</th>
            <th>評価損益</th>
            <th>評価損益率</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.id">
            <td>{{ row.tradeLabel }}</td>
            <td>{{ row.symbol }}</td>
            <td>{{ resolveAccountLabel(row) }}</td>
            <td>{{ formatNumber(row.shares, 4) }}</td>
            <td>{{ formatNumber(row.averagePrice, 2) }}</td>
            <td>{{ formatNumber(row.currentPrice, 2) }}</td>
            <td>{{ formatNumber(row.evaluationAmount, 0) }}</td>
            <td :class="profitClass(row.profitLoss)">{{ formatNumber(row.profitLoss, 0) }}</td>
            <td :class="profitClass(row.profitLossRate)">{{ formatNumber(row.profitLossRate, 2) }}%</td>
            <td><button @click="handleDelete(row.id)">削除</button></td>
          </tr>
        </tbody>
      </table>
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
  width: min(520px, 100%);
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
  overflow-x: auto;
}

.stocks-view__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1080px;
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
.stocks-view__table td:nth-child(2),
.stocks-view__table th:nth-child(3),
.stocks-view__table td:nth-child(3),
.stocks-view__table th:nth-child(10),
.stocks-view__table td:nth-child(10) {
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
</style>
