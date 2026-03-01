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
  totalEvaluationAmount,
  fetchStocks,
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
const showAddModal = ref(false)
const fundPriceInputs = ref<Record<string, number>>({})

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

function syncFundPriceInputs() {
  const next: Record<string, number> = {}
  for (const row of fundRows.value) {
    next[row.id] = Number(row.current_price ?? 0)
  }
  fundPriceInputs.value = next
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

  try {
    await addStock({
      symbol: symbolInput.value,
      name: nameInput.value,
      type: typeInput.value,
      account_type: accountTypeInput.value || '未設定',
      quantity: quantityInput.value ?? 0,
      average_price: averagePriceInput.value ?? 0,
      current_price: typeInput.value === 'fund' ? (currentPriceInput.value ?? averagePriceInput.value ?? 0) : undefined,
    })

    symbolInput.value = ''
    nameInput.value = ''
    typeInput.value = 'stock'
    accountTypeInput.value = ''
    quantityInput.value = undefined
    averagePriceInput.value = undefined
    currentPriceInput.value = undefined
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
    await updatePrices()
  } catch (error) {
    formError.value = error instanceof Error
      ? `個別株の価格更新に失敗しました。(${error.message})`
      : '個別株の価格更新に失敗しました。'
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
    await updateFundPrice(id, fundPriceInputs.value[id] ?? 0)
    syncFundPriceInputs()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '投資信託価格の保存に失敗しました。'
  }
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
      <button class="stocks-view__update-btn" :disabled="updatingPrices" @click="handleUpdatePrices">
        {{ updatingPrices ? '更新中...' : '価格更新（個別株のみ）' }}
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

      <table v-else class="stocks-view__table">
        <thead>
          <tr>
            <th>銘柄名</th>
            <th>口座区分</th>
            <th>保有数量</th>
            <th>平均取得価額</th>
            <th>現在価格</th>
            <th>評価額</th>
            <th>評価損益</th>
            <th>評価損益率</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in stockRows" :key="row.id">
            <td>{{ row.name }}</td>
            <td>{{ row.account_type }}</td>
            <td>{{ formatNumber(Number(row.quantity), 4) }}{{ quantityUnit(row.type) }}</td>
            <td>{{ formatNumber(Number(row.average_price), 2) }}</td>
            <td>
              <div class="stocks-view__fund-price-cell">
                <input v-model.number="fundPriceInputs[row.id]" type="number" step="0.0001" min="0" />
                <button @click="handleSaveFundPrice(row.id)">保存</button>
              </div>
            </td>
            <td>{{ formatNumber(Number(row.evaluation_amount), 0) }}</td>
            <td :class="profitClass(Number(row.profit_loss))">{{ formatNumber(Number(row.profit_loss), 0) }}</td>
            <td :class="profitClass(Number(row.profit_loss_rate))">{{ formatNumber(Number(row.profit_loss_rate), 2) }}%</td>
            <td><button @click="handleDelete(row.id)">削除</button></td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card stocks-view__table-wrap">
      <h3 style="margin-top: 0;">投資信託</h3>
      <p v-if="loading">読み込み中...</p>
      <p v-else-if="fundRows.length === 0">投資信託はありません。</p>
      <table v-else class="stocks-view__table">
        <thead>
          <tr>
            <th>銘柄名</th>
            <th>口座区分</th>
            <th>保有数量</th>
            <th>平均取得価額</th>
            <th>現在価格</th>
            <th>評価額</th>
            <th>評価損益</th>
            <th>評価損益率</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in fundRows" :key="row.id">
            <td>{{ row.name }}</td>
            <td>{{ row.account_type }}</td>
            <td>{{ formatNumber(Number(row.quantity), 4) }}{{ quantityUnit(row.type) }}</td>
            <td>{{ formatNumber(Number(row.average_price), 2) }}</td>
            <td>{{ formatNumber(Number(row.current_price), 2) }}</td>
            <td>{{ formatNumber(Number(row.evaluation_amount), 0) }}</td>
            <td :class="profitClass(Number(row.profit_loss))">{{ formatNumber(Number(row.profit_loss), 0) }}</td>
            <td :class="profitClass(Number(row.profit_loss_rate))">{{ formatNumber(Number(row.profit_loss_rate), 2) }}%</td>
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
  overflow-x: auto;
}

.stocks-view__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
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
.stocks-view__table th:nth-child(9),
.stocks-view__table td:nth-child(9) {
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
  justify-content: flex-end;
  gap: 0.35rem;
}

.stocks-view__fund-price-cell input {
  width: 120px;
}
</style>
