<script setup lang="ts">
import { computed, ref } from 'vue'
import ExpensePieChart from '@/components/charts/ExpensePieChart.vue'
import { useHousehold } from '@/composables/useHousehold'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import { useMonthlySummary } from '@/composables/useMonthlySummary'
import { useCreditCards } from '@/composables/useCreditCards'
import { sessionStore } from '@/stores/session'

const { currentHouseholdId } = useHousehold()
const { categories } = useCategories(() => currentHouseholdId.value)
const { transactions, selectedMonth, totalIncome, totalExpense, createTransaction } = useTransactions(() => currentHouseholdId.value)
const { activeCards } = useCreditCards(() => currentHouseholdId.value)

const summary = useMonthlySummary(
  () => transactions.value,
  (categoryId) => categories.value.find((c) => c.id === categoryId)?.name ?? '未分類',
)

const monthInput = computed({
  get: () => selectedMonth.value.toISOString().slice(0, 7),
  set: (value: string) => {
    selectedMonth.value = new Date(`${value}-01T00:00:00`)
  },
})

const expenseByCategory = computed(() => {
  const map = new Map<string, number>()
  for (const tx of transactions.value) {
    if (tx.kind !== 'expense') continue
    const name = categories.value.find((c) => c.id === tx.category_id)?.name ?? '未分類'
    map.set(name, (map.get(name) ?? 0) + Number(tx.amount))
  }
  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
})

const expenseCategories = computed(() =>
  categories.value.filter((c) => c.kind === 'expense'),
)

const form = ref({
  category_id: '',
  amount: 0,
  transaction_date: new Date().toISOString().slice(0, 10),
  credit_card_id: '',
  note: '',
})

const formError = ref('')
const formMessage = ref('')

async function submitExpense() {
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
      kind: 'expense',
      amount: Number(form.value.amount),
      transaction_date: form.value.transaction_date,
      note: form.value.note || null,
      credit_card_id: form.value.credit_card_id || null,
    })
    form.value.amount = 0
    form.value.note = ''
    formMessage.value = '支出を登録しました。'
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '支出登録に失敗しました。'
  }
}
</script>

<template>
  <main class="row" style="flex-direction: column;">
    <section class="card row" style="justify-content: space-between; align-items: center;">
      <h1 style="margin: 0;">支出</h1>
      <input v-model="monthInput" type="month" />
    </section>

    <section class="row">
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>今月の支出合計</h3>
        <p>{{ totalExpense.toLocaleString() }} 円</p>
      </article>
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>今月の収入合計</h3>
        <p>{{ totalIncome.toLocaleString() }} 円</p>
      </article>
      <article class="card" style="flex: 1; min-width: 220px;">
        <h3>今月の収支</h3>
        <p>{{ (totalIncome - totalExpense).toLocaleString() }} 円</p>
      </article>
    </section>

    <section class="row">
      <ExpensePieChart :chart-data="summary.pieData.value" />
      <article class="card" style="flex: 1; min-width: 320px;">
        <h3>カテゴリ別支出（今月）</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th align="left">カテゴリ</th>
              <th align="left">金額</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in expenseByCategory" :key="row.name">
              <td>{{ row.name }}</td>
              <td>{{ row.amount.toLocaleString() }} 円</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>

    <section class="card">
      <h3>支出登録</h3>
      <div class="row">
        <select v-model="form.category_id">
          <option value="">カテゴリを選択</option>
          <option v-for="c in expenseCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model.number="form.amount" type="number" min="1" placeholder="金額" />
        <input v-model="form.transaction_date" type="date" />
        <select v-model="form.credit_card_id">
          <option value="">支払い方法（現金/口座）</option>
          <option v-for="card in activeCards" :key="card.id" :value="card.id">
            {{ card.card_name }}{{ card.last4 ? ` (****${card.last4})` : '' }}
          </option>
        </select>
        <input v-model="form.note" placeholder="メモ" />
        <button @click="submitExpense">支出を追加</button>
      </div>
      <p v-if="formMessage" style="margin: 0.5rem 0 0; color: #059669;">{{ formMessage }}</p>
      <p v-if="formError" style="margin: 0.5rem 0 0; color: #dc2626;">{{ formError }}</p>
    </section>
  </main>
</template>
