<script setup lang="ts">
import { useAccounts } from '@/composables/useAccounts'
import { useHousehold } from '@/composables/useHousehold'
import { ref } from 'vue'

const { currentHouseholdId } = useHousehold()
const { accounts, totalBalance, loading, addAccount, updateAccount, deleteAccount } = useAccounts(() => currentHouseholdId.value)

const showAdd = ref(false)
const newName = ref('')
const newBalance = ref(0)
const saving = ref(false)

const editId = ref<string | null>(null)
const editName = ref('')
const editBalance = ref(0)

async function handleAdd() {
  if (!newName.value.trim()) return
  saving.value = true
  try {
    await addAccount(newName.value.trim(), newBalance.value)
    newName.value = ''
    newBalance.value = 0
    showAdd.value = false
  } finally {
    saving.value = false
  }
}

function startEdit(acc: any) {
  editId.value = acc.id
  editName.value = acc.institution_name
  editBalance.value = acc.balance
}

async function handleEdit() {
  if (!editId.value) return
  saving.value = true
  try {
    await updateAccount(editId.value, { institution_name: editName.value, balance: editBalance.value })
    editId.value = null
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('この口座を削除しますか？')) return
  await deleteAccount(id)
}

function formatAmount(n: number) {
  return `¥${n.toLocaleString()}`
}
</script>

<template>
  <div class="space-y-6 pb-28">
    <section>
      <p class="font-label text-[11px] text-on-surface-variant font-semibold uppercase tracking-widest">資産管理</p>
      <h1 class="text-3xl font-extrabold tracking-tight text-on-surface font-headline mt-1">口座一覧</h1>
    </section>

    <!-- Total -->
    <div class="bg-primary rounded-[2rem] p-6 text-on-primary shadow">
      <p class="font-label text-[11px] opacity-80 font-semibold uppercase tracking-widest">総預金残高</p>
      <p class="text-4xl font-extrabold tracking-tighter mt-2">{{ formatAmount(totalBalance) }}</p>
    </div>

    <!-- Account List -->
    <div v-if="loading" class="text-center py-8 text-on-surface-variant text-sm">読み込み中…</div>
    <div v-else class="space-y-3">
      <div
        v-for="acc in accounts"
        :key="acc.id"
        class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden"
      >
        <!-- Edit mode -->
        <div v-if="editId === acc.id" class="p-4 space-y-3">
          <input v-model="editName" class="w-full rounded-xl border border-outline px-3 py-2 text-sm" placeholder="金融機関名" />
          <input v-model.number="editBalance" type="number" class="w-full rounded-xl border border-outline px-3 py-2 text-sm" placeholder="残高" />
          <div class="flex gap-2">
            <button @click="handleEdit" :disabled="saving" class="flex-1 bg-primary text-on-primary py-2 rounded-xl text-sm font-bold">保存</button>
            <button @click="editId = null" class="flex-1 bg-surface-container py-2 rounded-xl text-sm font-bold">キャンセル</button>
          </div>
        </div>
        <!-- View mode -->
        <div v-else class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 bg-primary-fixed rounded-2xl flex items-center justify-center">
              <span class="material-symbols-outlined text-on-primary-fixed-variant" style="font-variation-settings: 'FILL' 1;">account_balance</span>
            </div>
            <div>
              <p class="font-bold text-on-surface">{{ acc.institution_name }}</p>
              <p class="text-sm font-bold text-primary mt-0.5">{{ formatAmount(acc.balance) }}</p>
            </div>
          </div>
          <div class="flex gap-1">
            <button @click="startEdit(acc)" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
            </button>
            <button @click="handleDelete(acc.id)" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
              <span class="material-symbols-outlined text-[18px] text-error">delete</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="accounts.length === 0 && !loading" class="text-center py-10 text-on-surface-variant text-sm bg-surface-container-lowest rounded-2xl">
        口座がまだ登録されていません
      </div>
    </div>

    <!-- Add Form -->
    <div v-if="showAdd" class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-4 space-y-3">
      <h3 class="font-bold text-on-surface">口座を追加</h3>
      <input v-model="newName" class="w-full rounded-xl border border-outline px-3 py-2 text-sm" placeholder="例：楽天銀行" />
      <input v-model.number="newBalance" type="number" class="w-full rounded-xl border border-outline px-3 py-2 text-sm" placeholder="現在の残高（円）" />
      <div class="flex gap-2">
        <button @click="handleAdd" :disabled="saving" class="flex-1 bg-primary text-on-primary py-2 rounded-xl text-sm font-bold">追加</button>
        <button @click="showAdd = false" class="flex-1 bg-surface-container py-2 rounded-xl text-sm font-bold">キャンセル</button>
      </div>
    </div>

    <!-- FAB -->
    <button
      v-if="!showAdd"
      @click="showAdd = true"
      class="fixed bottom-28 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform duration-200"
    >
      <span class="material-symbols-outlined text-2xl">add</span>
    </button>
  </div>
</template>
