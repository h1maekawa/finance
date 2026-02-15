<script setup lang="ts">
import { ref } from 'vue'
import { useHousehold } from '@/composables/useHousehold'
import { useCategories } from '@/composables/useCategories'
import type { TransactionKind } from '@/types/db'

const { currentHouseholdId } = useHousehold()
const { categories, createCategory, updateCategory, deleteCategory } = useCategories(
  () => currentHouseholdId.value,
)

const form = ref({
  id: '',
  name: '',
  kind: 'expense' as TransactionKind,
  color: '#3b82f6',
})

function startEdit(id: string) {
  const target = categories.value.find((v) => v.id === id)
  if (!target) return
  form.value = {
    id: target.id,
    name: target.name,
    kind: target.kind,
    color: target.color ?? '#3b82f6',
  }
}

function resetForm() {
  form.value = {
    id: '',
    name: '',
    kind: 'expense',
    color: '#3b82f6',
  }
}

async function submit() {
  if (!form.value.name) return

  if (form.value.id) {
    await updateCategory(form.value.id, {
      name: form.value.name,
      kind: form.value.kind,
      color: form.value.color,
    })
  } else {
    await createCategory({
      name: form.value.name,
      kind: form.value.kind,
      color: form.value.color,
    })
  }
  resetForm()
}
</script>

<template>
  <main class="row" style="flex-direction: column;">
    <section class="card">
      <h1>カテゴリ管理</h1>
      <div class="row">
        <input v-model="form.name" placeholder="カテゴリ名" />
        <select v-model="form.kind">
          <option value="expense">支出</option>
          <option value="income">収入</option>
        </select>
        <input v-model="form.color" type="color" />
        <button @click="submit">{{ form.id ? '更新' : '追加' }}</button>
        <button v-if="form.id" @click="resetForm">キャンセル</button>
      </div>
    </section>

    <section class="card">
      <h2>カテゴリ一覧</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th align="left">名前</th>
            <th align="left">種別</th>
            <th align="left">色</th>
            <th align="left">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in categories" :key="c.id">
            <td>{{ c.name }}</td>
            <td>{{ c.kind === 'income' ? '収入' : '支出' }}</td>
            <td>
              <span :style="{ display: 'inline-block', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: c.color ?? '#94a3b8' }" />
            </td>
            <td class="row">
              <button @click="startEdit(c.id)">編集</button>
              <button :disabled="false" @click="deleteCategory(c.id)">削除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>
