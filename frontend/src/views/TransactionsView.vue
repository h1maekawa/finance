<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHousehold } from '@/composables/useHousehold'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import type { TransactionKind } from '@/types/db'

const { currentHouseholdId } = useHousehold()
const {
  transactions,
  selectedMonth,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = useTransactions(() => currentHouseholdId.value)
const { categories } = useCategories(() => currentHouseholdId.value)
const devUserId = import.meta.env.VITE_DEV_USER_ID as string | undefined

const form = ref({
  id: '',
  category_id: '',
  kind: 'expense' as TransactionKind,
  amount: 0,
  transaction_date: new Date().toISOString().slice(0, 10),
  note: '',
})

const monthInput = computed({
  get: () => selectedMonth.value.toISOString().slice(0, 7),
  set: (value: string) => {
    selectedMonth.value = new Date(`${value}-01T00:00:00`)
  },
})

const selectableCategories = computed(() =>
  categories.value.filter((c) => c.kind === form.value.kind),
)

function startEdit(id: string) {
  const target = transactions.value.find((v) => v.id === id)
  if (!target) return
  form.value = {
    id: target.id,
    category_id: target.category_id,
    kind: target.kind,
    amount: target.amount,
    transaction_date: target.transaction_date,
    note: target.note ?? '',
  }
}

function resetForm() {
  form.value = {
    id: '',
    category_id: '',
    kind: 'expense',
    amount: 0,
    transaction_date: new Date().toISOString().slice(0, 10),
    note: '',
  }
}

async function submit() {
  const userId = devUserId
  if (!userId) return

  const payload = {
    user_id: userId,
    category_id: form.value.category_id,
    kind: form.value.kind,
    amount: Number(form.value.amount),
    transaction_date: form.value.transaction_date,
    note: form.value.note || null,
  }

  if (form.value.id) {
    await updateTransaction(form.value.id, payload)
  } else {
    await createTransaction(payload)
  }
  resetForm()
}
</script>

<template>
  <main class="row" style="flex-direction: column;">
    <section class="card row" style="justify-content: space-between; align-items: center;">
      <h1 style="margin: 0;">取引管理</h1>
      <input v-model="monthInput" type="month" />
    </section>

    <section class="card">
      <h2>{{ form.id ? '取引編集' : '取引登録' }}</h2>
      <div class="row">
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
        <input v-model="form.note" placeholder="メモ" />
        <button @click="submit">{{ form.id ? '更新' : '追加' }}</button>
        <button v-if="form.id" @click="resetForm">キャンセル</button>
      </div>
    </section>

    <section class="card">
      <h2>取引一覧</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th align="left">日付</th>
            <th align="left">種別</th>
            <th align="left">金額</th>
            <th align="left">カテゴリ</th>
            <th align="left">メモ</th>
            <th align="left">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in transactions" :key="t.id">
            <td>{{ t.transaction_date }}</td>
            <td>{{ t.kind === 'income' ? '収入' : '支出' }}</td>
            <td>{{ Number(t.amount).toLocaleString() }}</td>
            <td>{{ categories.find((c) => c.id === t.category_id)?.name ?? '-' }}</td>
            <td>{{ t.note ?? '' }}</td>
            <td class="row">
              <button @click="startEdit(t.id)">編集</button>
              <button @click="deleteTransaction(t.id)">削除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>
