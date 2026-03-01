<script setup lang="ts">
import { computed, ref } from 'vue'
import ExpensePieChart from '@/components/charts/ExpensePieChart.vue'
import { useHousehold } from '@/composables/useHousehold'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import { useMonthlySummary } from '@/composables/useMonthlySummary'
import { useCreditCards } from '@/composables/useCreditCards'
import { useAssetBreakdown } from '@/composables/useAssetBreakdown'
import { useMonthlySnapshots } from '@/composables/useMonthlySnapshots'
import { sessionStore } from '@/stores/session'
import type { TransactionKind } from '@/types/db'

const { currentHouseholdId } = useHousehold()
const { categories, incomeCategories, expenseCategories } = useCategories(() => currentHouseholdId.value)
const { activeCards } = useCreditCards(() => currentHouseholdId.value)
const { totalAssets } = useAssetBreakdown(() => currentHouseholdId.value)
const { snapshots, saveSnapshot } = useMonthlySnapshots(() => currentHouseholdId.value)
const {
  transactions,
  selectedMonth,
  totalIncome,
  totalExpense,
  createTransaction,
} = useTransactions(() => currentHouseholdId.value)

const summary = useMonthlySummary(
  () => transactions.value,
  (categoryId) => categories.value.find((c) => c.id === categoryId)?.name ?? '未分類',
)

const netTotal = computed(() => totalIncome.value - totalExpense.value)
const snapshotSavedMessage = ref('')
const snapshotErrorMessage = ref('')

const monthInput = computed({
  get: () => selectedMonth.value.toISOString().slice(0, 7),
  set: (value: string) => {
    selectedMonth.value = new Date(`${value}-01T00:00:00`)
  },
})

const targetMonth = computed(() => `${monthInput.value}-01`)

const form = ref({
  kind: 'expense' as TransactionKind,
  category_id: '',
  amount: 0,
  transaction_date: new Date().toISOString().slice(0, 10),
  credit_card_id: '',
  note: '',
})

const formError = ref('')
const formMessage = ref('')

const selectableCategories = computed(() =>
  form.value.kind === 'income' ? incomeCategories.value : expenseCategories.value,
)

function resetForm() {
  form.value = {
    kind: 'expense',
    category_id: '',
    amount: 0,
    transaction_date: new Date().toISOString().slice(0, 10),
    credit_card_id: '',
    note: '',
  }
}

async function submitTransaction() {
  formError.value = ''
  formMessage.value = ''

  const userId = sessionStore.user?.id
  if (!userId) {
    formError.value = 'ログイン情報がありません。'
    return
  }
  if (!form.value.category_id) {
    formError.value = 'カテゴリを選択してください。'
    return
  }
  if (!form.value.amount || form.value.amount <= 0) {
    formError.value = '金額を入力してください。'
    return
  }

  try {
    await createTransaction({
      user_id: userId,
      category_id: form.value.category_id,
      kind: form.value.kind,
      amount: Number(form.value.amount),
      transaction_date: form.value.transaction_date,
      note: form.value.note || null,
      credit_card_id: form.value.kind === 'expense' ? (form.value.credit_card_id || null) : null,
    })
    formMessage.value = form.value.kind === 'income' ? '収入を登録しました。' : '支出を登録しました。'
    resetForm()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '登録に失敗しました。'
  }
}

async function saveMonthlySnapshot() {
  snapshotSavedMessage.value = ''
  snapshotErrorMessage.value = ''

  try {
    await saveSnapshot({
      target_month: targetMonth.value,
      income_total: totalIncome.value,
      expense_total: totalExpense.value,
      net_total: netTotal.value,
      month_end_assets: totalAssets.value,
    })
    snapshotSavedMessage.value = '月次データを保存しました。'
    setTimeout(() => {
      snapshotSavedMessage.value = ''
    }, 1600)
  } catch (error) {
    snapshotErrorMessage.value = error instanceof Error ? error.message : '月次データ保存に失敗しました。'
  }
}
</script>

<template>
  <main class="cashflow-view">
    <section class="card row" style="justify-content: space-between; align-items: center;">
      <h1 style="margin: 0;">収支</h1>
      <input v-model="monthInput" type="month" />
    </section>

    <section class="cashflow-view__chart">
      <ExpensePieChart :chart-data="summary.pieData.value" />
    </section>

    <section class="cashflow-view__summary-grid">
      <article class="cashflow-view__summary-card">
        <h2 class="cashflow-view__summary-label">今月の収入合計</h2>
        <p class="cashflow-view__summary-value cashflow-view__summary-value--income">{{ totalIncome.toLocaleString() }}円</p>
      </article>
      <article class="cashflow-view__summary-card">
        <h2 class="cashflow-view__summary-label">今月の支出合計</h2>
        <p class="cashflow-view__summary-value cashflow-view__summary-value--expense">{{ totalExpense.toLocaleString() }}円</p>
      </article>
    </section>

    <section class="cashflow-view__summary-grid">
      <article class="cashflow-view__summary-card">
        <h2 class="cashflow-view__summary-label">今月の収支</h2>
        <p class="cashflow-view__summary-value" :class="netTotal >= 0 ? 'cashflow-view__summary-value--income' : 'cashflow-view__summary-value--expense'">
          {{ netTotal.toLocaleString() }}円
        </p>
      </article>
      <article class="cashflow-view__summary-card">
        <h2 class="cashflow-view__summary-label">月末資産額（記録用）</h2>
        <p class="cashflow-view__summary-value">{{ totalAssets.toLocaleString() }}円</p>
      </article>
    </section>

    <section class="card">
      <h3 style="margin-top: 0;">月次記録</h3>
      <p style="margin-top: 0; color: #64748b;">選択中の月（{{ monthInput }}）の収支・資産額を履歴として保存します。</p>
      <button @click="saveMonthlySnapshot">この月を保存</button>
      <p v-if="snapshotSavedMessage" style="margin: 0.5rem 0 0; color: #2563eb;">{{ snapshotSavedMessage }}</p>
      <p v-if="snapshotErrorMessage" style="margin: 0.5rem 0 0; color: #dc2626;">{{ snapshotErrorMessage }}</p>
    </section>

    <section class="card">
      <h3 style="margin-top: 0;">月次履歴</h3>
      <p v-if="snapshots.length === 0" style="margin: 0; color: #6b7280;">まだ月次履歴がありません。</p>
      <div v-else style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; min-width: 720px;">
          <thead>
            <tr>
              <th align="left">対象月</th>
              <th align="left">収入</th>
              <th align="left">支出</th>
              <th align="left">収支</th>
              <th align="left">月末資産額</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in snapshots" :key="row.id">
              <td>{{ row.target_month.slice(0, 7) }}</td>
              <td>{{ Number(row.income_total).toLocaleString() }} 円</td>
              <td>{{ Number(row.expense_total).toLocaleString() }} 円</td>
              <td>{{ Number(row.net_total).toLocaleString() }} 円</td>
              <td>{{ Number(row.month_end_assets).toLocaleString() }} 円</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h3 style="margin-top: 0;">収入・支出を登録</h3>
      <div class="row" style="align-items: center;">
        <select v-model="form.kind">
          <option value="income">収入</option>
          <option value="expense">支出</option>
        </select>
        <select v-model="form.category_id">
          <option value="">カテゴリを選択</option>
          <option v-for="c in selectableCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model.number="form.amount" type="number" min="1" placeholder="金額" />
        <input v-model="form.transaction_date" type="date" />
        <select v-if="form.kind === 'expense'" v-model="form.credit_card_id">
          <option value="">支払い方法（現金/口座）</option>
          <option v-for="card in activeCards" :key="card.id" :value="card.id">
            {{ card.card_name }}
          </option>
        </select>
        <input v-model="form.note" placeholder="メモ" />
        <button @click="submitTransaction">{{ form.kind === 'income' ? '収入を追加' : '支出を追加' }}</button>
      </div>
      <p v-if="formMessage" style="margin: 0.5rem 0 0; color: #059669;">{{ formMessage }}</p>
      <p v-if="formError" style="margin: 0.5rem 0 0; color: #dc2626;">{{ formError }}</p>
    </section>
  </main>
</template>

<style scoped>
.cashflow-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.cashflow-view__chart :deep(.card) {
  margin: 0;
}

.cashflow-view__summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.cashflow-view__summary-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
}

.cashflow-view__summary-label {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.cashflow-view__summary-value {
  margin: 0.35rem 0 0;
  font-size: 2rem;
  font-weight: 800;
}

.cashflow-view__summary-value--income {
  color: #059669;
}

.cashflow-view__summary-value--expense {
  color: #dc2626;
}
</style>
