<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStocks } from '@/composables/useStocks'

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

const formError = ref('')
const symbolInput = ref('')
const accountTypeInput = ref('特定口座')
const sharesInput = ref<number | undefined>(undefined)
const averagePriceInput = ref<number | undefined>(undefined)

const tableRows = computed(() =>
  stocks.value.map((stock) => ({
    id: stock.id,
    tradeLabel: '現物',
    symbol: stock.symbol,
    accountType: stock.account_type,
    shares: Number(stock.shares ?? 0),
    averagePrice: Number(stock.average_price ?? 0),
    currentPrice: Number(stock.current_price ?? 0),
    evaluationAmount: Number(stock.evaluation_amount ?? 0),
    profitLoss: Number(stock.profit_loss ?? 0),
    profitLossRate: Number(stock.profit_loss_rate ?? 0),
  })),
)

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
    await addStock({
      symbol: symbolInput.value,
      account_type: accountTypeInput.value || '特定口座',
      shares: sharesInput.value ?? 0,
      average_price: averagePriceInput.value ?? 0,
    })
    symbolInput.value = ''
    accountTypeInput.value = '特定口座'
    sharesInput.value = undefined
    averagePriceInput.value = undefined
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
      <button class="stocks-view__update-btn" :disabled="updatingPrices" @click="handleUpdatePrices">
        {{ updatingPrices ? '更新中...' : '価格更新' }}
      </button>
      <ul v-if="updateErrors.length > 0" class="stocks-view__errors">
        <li v-for="err in updateErrors" :key="err">{{ err }}</li>
      </ul>
      <p v-if="formError" class="stocks-view__error">{{ formError }}</p>
    </section>

    <section class="card">
      <h3 style="margin-top: 0;">銘柄追加</h3>
      <form class="stocks-view__form" @submit.prevent="handleAddStock">
        <input v-model="symbolInput" type="text" placeholder="銘柄コード（例: AAPL）" required />
        <input v-model="accountTypeInput" type="text" placeholder="口座区分（例: 特定口座）" required />
        <input v-model.number="sharesInput" type="number" step="0.0001" min="0" placeholder="保有数量" required />
        <input v-model.number="averagePriceInput" type="number" step="0.0001" min="0" placeholder="平均取得価額" required />
        <button type="submit">追加</button>
      </form>
    </section>

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
            <td>{{ row.accountType }}</td>
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
